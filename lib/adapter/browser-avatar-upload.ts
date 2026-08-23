/**
 * 어댑터 · 브라우저에서 프로필 사진을 수파베이스 스토리지에 올린다.
 *
 * [[browser-cover-upload]] 와 같은 방식이다. 서버를 거치지 않고 브라우저가
 * 곧장 올린다 — 우리 서버를 거치면 같은 파일을 두 번 나르게 된다.
 *
 * 다만 표지와 다른 점이 하나 있다. **올리기 전에 줄인다.**
 * 사람이 고르는 것은 휴대폰으로 찍은 4MB 짜리 사진인데, 실제로 쓰이는 자리는
 * 지름 40px 짜리 동그라미다. 그대로 올리면 버킷 한도(2MB)에 걸리고,
 * 걸리지 않더라도 글 목록을 열 때마다 그 큰 파일을 내려받게 된다.
 */

import { createBrowserClient } from "@supabase/ssr";

/** 프로필 사진이 놓이는 자리 */
const BUCKET = "avatars";

/** 줄여서 담을 한 변의 길이. 화면에서 가장 크게 쓰이는 자리의 두 배쯤이다 */
const SIDE = 256;

/** 올린 결과 */
export type AvatarUploadResult =
  | { ok: true; url: string }
  /** 로그인이 안 되어 있다. 자기 폴더가 없으니 올릴 수 없다 */
  | { ok: false; reason: "signed-out" }
  /** 그림 파일이 아니거나 열지 못했다 */
  | { ok: false; reason: "not-image" }
  /** 저쪽이 거절했다 */
  | { ok: false; reason: "rejected"; detail?: string }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 브라우저에서 쓰는 수파베이스 손잡이 */
// [F1][함수] client(): 브라우저에서 쓰는 수파베이스 손잡이를 만든다
// 입력: process.env → 처리: 값이 없으면 던짐 → 출력: SupabaseClient
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
 * 고른 사진을 정사각형으로 잘라 작게 줄인다.
 *
 * 가운데를 기준으로 짧은 변에 맞춰 자른다. 그냥 찌그러뜨리면 얼굴이 늘어나고,
 * 위쪽을 기준으로 자르면 사람 얼굴이 잘려 나간다.
 */
// [F2][함수] shrink(file): 고른 사진을 정사각형으로 잘라 256px webp 로 줄인다
// 입력: file(사람이 고른 파일) → 처리: 비트맵 → 캔버스에 가운데만 그림 → toBlob
// 출력: Blob 또는 null (F6 이 부른다)
async function shrink(file: File): Promise<Blob | null> {
  /* createImageBitmap 은 사진을 화면에 붙이지 않고 바로 읽어 준다.
     <img> 를 만들어 onload 를 기다리는 옛 방법보다 짧고, 큰 사진에서 더 빠르다 */
  let bitmap: ImageBitmap;
  try {
    // [F3][외부] ▷ createImageBitmap(file) — 파일을 그림으로 읽어 온다 → bitmap
    bitmap = await createImageBitmap(file);
  } catch {
    // 그림이 아니거나 브라우저가 못 여는 형식이다
    // [F4][에러] 그림이 아니거나 못 여는 형식 → null 반환 → F7 이 'not-image' 로 다룬다
    return null;
  }

  // 짧은 변이 곧 잘라 낼 정사각형의 한 변이다
  // [F5][흐름] 짧은 변 → side / 넘치는 만큼의 절반 → left, top (가운데를 남긴다)
  const side = Math.min(bitmap.width, bitmap.height);

  // 가운데를 남기려면 넘치는 만큼의 절반씩 양쪽에서 덜어 낸다
  const left = (bitmap.width - side) / 2;
  const top = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 원본에서 잘라 낼 자리와, 캔버스에 그릴 자리를 함께 준다
  ctx.drawImage(bitmap, left, top, side, side, 0, 0, SIDE, SIDE);

  /* 다 쓴 비트맵은 놓아 준다. 안 놓으면 큰 사진 몇 장에 메모리가 금세 찬다 */
  bitmap.close();

  /* png 가 아니라 webp 로 담는다. 사진은 png 로 두면 몇 배가 되는데,
     여기 올라오는 것은 그림이 아니라 사진이다 */
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
}

/**
 * 프로필 사진을 올리고 공개 주소를 돌려준다.
 *
 * 파일 이름을 `<내 uuid>/<시각>.webp` 로 짓는다. 앞칸이 내 uuid 여야
 * 정책이 통과시킨다. 시각을 붙이는 까닭은 겹치지 않게 하려는 것도 있지만,
 * **주소가 바뀌어야 브라우저가 새 사진을 받아 오기** 때문이기도 하다 —
 * 같은 이름으로 덮어쓰면 옛 사진이 한참 남는다.
 */
// [F6][함수] uploadAvatar(file): 프로필 사진을 줄여서 스토리지에 올린다
// 입력: file → 처리: 로그인 확인 → shrink(F2) → 내 폴더에 업로드 → 공개 주소
// 출력: {ok:true, url} 또는 까닭 (비동기)
export async function uploadAvatar(file: File): Promise<AvatarUploadResult> {
  try {
    const supabase = client();

    const { data: me } = await supabase.auth.getUser();
    if (!me.user) return { ok: false, reason: "signed-out" };

    // [F7][호출] file → shrink(F2) → small (못 줄였으면 원본을 올리지 않는다)
    const small = await shrink(file);

    // 못 줄였으면 원본을 올리지 않는다. 4MB 짜리를 그대로 올려 봐야 거절당한다
    if (!small) return { ok: false, reason: "not-image" };

    // [F8][흐름] 내 uuid + 지금 시각 → path (주소가 바뀌어야 브라우저가 새 사진을 받는다)
    const path = `${me.user.id}/${Date.now()}.webp`;

    // [F9][외부] small ▷ storage(avatars) upload → error
    const { error } = await supabase.storage.from(BUCKET).upload(path, small, {
      contentType: "image/webp",
      // 시각이 붙어 있어 겹칠 일이 없다. 덮어쓰기를 열어 둘 까닭도 없다
      upsert: false,
    });

    if (error) return { ok: false, reason: "rejected", detail: error.message };

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    // [F10][반환] {ok:true, url} → photo-form 의 숨은 칸 → setPhotoAction → profiles.avatar_url
    return { ok: true, url: data.publicUrl };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}
