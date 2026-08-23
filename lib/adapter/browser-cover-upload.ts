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
// [F1][함수] client(): 브라우저에서 쓰는 수파베이스 손잡이를 만든다
// 입력: process.env(NEXT_PUBLIC_*) → 처리: 값이 없으면 던짐 → 출력: SupabaseClient
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  /* ?? 가 아니라 || 를 쓴다. 버셀에 빈 칸으로 등록된 변수는 undefined 가 아니라
     빈 문자열로 들어와서, ?? 로는 걸러지지 않고 그대로 열쇠 자리에 앉는다 */
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 값이 없으면 여기서 멈춘다. 없는 채로 부르면 "fetch failed" 만 나온다
  // [F2][에러] 주소·키 없음 → 여기서 던진다(없는 채로 부르면 'fetch failed' 만 나온다)
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
// [F3][함수] uploadCover(png): 레시피 카드 그림을 스토리지에 올린다
// 입력: png(캔버스가 만든 Blob) → 처리: 로그인 확인 → 내 폴더에 업로드 → 공개 주소 조회
// 출력: {ok:true, url} 또는 까닭 (비동기)
export async function uploadCover(png: Blob): Promise<UploadResult> {
  try {
    const supabase = client();

    // [F4][외부] ▷ supabase.auth.getUser() → me (내 uuid 가 폴더 이름이 된다)
    const { data: me } = await supabase.auth.getUser();
    if (!me.user) return { ok: false, reason: "signed-out" };

    // [F5][흐름] 내 uuid + 지금 시각 → path ('<uuid>/1756….png')
    const path = `${me.user.id}/${Date.now()}.png`;

    // [F6][외부] png ▷ storage(post-covers) upload → error
    const { error } = await supabase.storage.from(BUCKET).upload(path, png, {
      contentType: "image/png",
      // 같은 이름이 이미 있으면 덮어쓰지 않는다. 시각이 붙어 있어 겹칠 일은 없다
      upsert: false,
    });

    // [F7][분기] error 있음 → true: 'rejected' + 저쪽 메시지 반환 / false: F8
    if (error) return { ok: false, reason: "rejected", detail: error.message };

    // [F8][외부] path ▷ storage.getPublicUrl() → data.publicUrl
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // [F9][반환] {ok:true, url} → write-form 의 숨은 칸(imageUrl) → publishPostAction 으로
    return { ok: true, url: data.publicUrl };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
