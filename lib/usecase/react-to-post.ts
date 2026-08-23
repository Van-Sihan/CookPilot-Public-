/**
 * 유스케이스 · "글에 좋아요를 누르고, 나중에 볼 글로 담아 둔다".
 *
 * 둘을 한 파일에 둔 까닭 — 화면에서 나란히 붙어 있는 단추 두 개이고,
 * 하는 일의 모양이 똑같다(켰다 껐다). 다만 **뜻은 다르다.**
 *
 *   · 좋아요는 남에게 보이는 값이다. 숫자가 카드에 찍힌다
 *   · 즐겨찾기는 나만 보는 서랍이다. 숫자도 안 센다
 *
 * 그 차이는 표에서 지킨다(RLS). 여기서는 "켜라/꺼라" 만 넘긴다.
 * 수파베이스라는 말은 이 파일에 한 번도 안 나온다.
 */

/** 반응을 담아 주는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type ReactionGateway = {
  /** 좋아요를 켜거나 끈다 */
  setLike(postId: string, on: boolean): Promise<GatewayReaction>;
  /** 즐겨찾기에 담거나 뺀다 */
  setBookmark(postId: string, on: boolean): Promise<GatewayReaction>;
};

/** 반응을 담아 주는 곳이 돌려주는 대답 */
export type GatewayReaction =
  | { ok: true }
  /** 로그인이 안 되어 있다. 좋아요는 누가 눌렀는지 남는 값이라 로그인이 필요하다 */
  | { ok: false; reason: "signed-out" }
  /** 표가 거절했다. 없는 글이거나 아직 안 펴낸 글이다 */
  | { ok: false; reason: "rejected" }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 화면이 받아 보는 결과 */
export type ReactResult =
  | { ok: true; on: boolean }
  | { ok: false; reason: Exclude<GatewayReaction, { ok: true }>["reason"] };

/** 글 번호가 우리가 다루는 모양인지 본다 */
// [F1][함수] looksLikePost(postId): 표에 있는 글 번호 모양인지 판정
// 입력: postId → 처리: uuid 정규식 대조 → 출력: boolean (F2·F5 가 부른다)
function looksLikePost(postId: string): boolean {
  /* 예시 글은 "ribeye" 같은 이름을 쓰고 표에 없다. 그런 id 로 다녀가면
     수파베이스가 오류를 내는데, 그건 고장이 아니라 남의 id 다 */
  return /^[0-9a-f-]{36}$/i.test(postId);
}

/**
 * 좋아요를 켜거나 끈다.
 *
 * `on` 을 화면이 정해서 넘긴다. "뒤집어 달라" 고 시키지 않는 까닭 —
 * 뒤집기를 표에 맡기면 두 번 빠르게 누를 때 지금 상태를 서로 다르게 보고
 * 켰다 껐다가 엇갈린다. 화면이 보고 있는 값을 그대로 시키는 편이 어긋나지 않는다.
 */
// [F2][함수] toggleLike(postId, on, gateway): 좋아요를 켜거나 끈다
// 입력: postId + on(화면이 정한 다음 상태) + gateway → 처리: id 검사 → 게이트웨이 호출
// 출력: ReactResult (비동기)
export async function toggleLike(
  postId: string,
  on: boolean,
  gateway: ReactionGateway,
): Promise<ReactResult> {
  // 예시 글에는 누를 자리가 없다. 다녀가 봐야 거절만 돌아온다
  // [F3][분기] uuid 가 아님(예시 글) → true: 'rejected' 반환 / false: F4
  if (!looksLikePost(postId)) return { ok: false, reason: "rejected" };

  // [F4][외부] postId, on → gateway.setLike() ▷ supabase post_likes insert/delete → answer
  // [F4][반환] {ok:true, on} 또는 까닭 → likeAction(app/actions/post.ts) 으로 전달
  const answer = await gateway.setLike(postId, on);

  return answer.ok ? { ok: true, on } : { ok: false, reason: answer.reason };
}

/** 즐겨찾기에 담거나 뺀다 */
// [F5][함수] toggleBookmark(postId, on, gateway): 즐겨찾기에 담거나 뺀다
// 입력: postId + on + gateway → 처리: id 검사 → 게이트웨이 호출 → 출력: ReactResult (비동기)
export async function toggleBookmark(
  postId: string,
  on: boolean,
  gateway: ReactionGateway,
): Promise<ReactResult> {
  // [F6][분기] uuid 가 아님 → true: 'rejected' 반환 / false: F7
  if (!looksLikePost(postId)) return { ok: false, reason: "rejected" };

  // [F7][외부] postId, on → gateway.setBookmark() ▷ supabase post_bookmarks insert/delete → answer
  // [F7][반환] 결과 → bookmarkAction(app/actions/post.ts) 으로 전달
  const answer = await gateway.setBookmark(postId, on);

  return answer.ok ? { ok: true, on } : { ok: false, reason: answer.reason };
}
