/**
 * 어댑터 · 브라우저에서 표지 그림을 수파베이스 스토리지에 올린다.
 *
 * 서버를 거치지 않고 브라우저가 곧장 올린다. 그림 한 장이 300KB 안팎인데,
 * 우리 서버를 한 번 거치면 그만큼을 두 번 나르게 된다.
 *
 * 안전한 까닭은 정책에 있다. 버킷은 로그인한 사람이 **자기 폴더에만** 올릴 수
 * 있게 막혀 있어서(마이그레이션 참고), 브라우저에서 부른다고 남의 그림을
 * 덮어쓸 수는 없다.
 */

import { createBrowserClient } from "@supabase/ssr";

/** 표지가 놓이는 자리 */
const BUCKET = "post-covers";

/** 올린 결과 */
export type UploadResult =
  | { ok: true; url: string }
  /** 로그인이 안 되어 있다. 자기 폴더가 없으니 올릴 수 없다 */
  | { ok: false; reason: "signed-out" }
  /** 저쪽이 거절했다. 크기나 형식에 걸렸을 수 있다 */
  | { ok: false; reason: "rejected"; detail?: string }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 브라우저에서 쓰는 수파베이스 손잡이 */
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 값이 없으면 여기서 멈춘다. 없는 채로 부르면 "fetch failed" 만 나온다
  if (!url || !key) throw new Error("수파베이스 주소·키가 없습니다");

  return createBrowserClient(url, key);
}

/**
 * 표지 그림을 올리고 공개 주소를 돌려준다.
 *
 * 파일 이름을 `<내 uuid>/<시각>.png` 로 짓는다. 앞칸이 내 uuid 여야
 * 정책이 통과시킨다. 시각을 붙이는 것은 같은 사람이 여러 장 올려도
 * 서로 안 덮어쓰게 하려는 것이다.
 */
export async function uploadCover(png: Blob): Promise<UploadResult> {
  try {
    const supabase = client();

    const { data: me } = await supabase.auth.getUser();
    if (!me.user) return { ok: false, reason: "signed-out" };

    const path = `${me.user.id}/${Date.now()}.png`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, png, {
      contentType: "image/png",
      // 같은 이름이 이미 있으면 덮어쓰지 않는다. 시각이 붙어 있어 겹칠 일은 없다
      upsert: false,
    });

    if (error) return { ok: false, reason: "rejected", detail: error.message };

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return { ok: true, url: data.publicUrl };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
