/**
 * 유스케이스 · "커뮤니티에 글을 올린다".
 *
 * 하는 일은 둘이다 — 받아 줄 만한 글인지 도메인에 묻고, 되면 담아 달라고 시킨다.
 * 수파베이스라는 말은 이 파일에 한 번도 안 나온다.
 *
 * 올리자마자 **펴낸 상태**로 둔다. 초안으로 두었다가 따로 펴내게 하면
 * 화면이 하나 더 필요하고, 쓴 사람은 왜 안 보이는지 몰라 헤맨다.
 */

import { readPostDraft, type DraftProblem, type PostDraft } from "@/lib/domain/post-draft";

/** 글을 담아 주는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type PostGateway = {
  /** 글 하나를 올리고, 올라간 글의 id 를 돌려준다 */
  publish(draft: PostDraft): Promise<GatewayPost>;
  /** 이미 올린 글을 고친다. 어느 글인지는 id 로 받는다 */
  revise(id: string, draft: PostDraft): Promise<GatewayPost>;
  /** 글을 지운다 */
  remove(id: string): Promise<GatewayPost>;
};

/** 글을 담아 주는 곳이 돌려주는 대답 */
export type GatewayPost =
  | { ok: true; id: string }
  /** 로그인이 안 되어 있다. 글은 로그인한 사람만 쓴다 */
  | { ok: false; reason: "signed-out" }
  /** 표가 거절했다. RLS 정책이나 칸 규칙에 걸린 것이다 */
  | { ok: false; reason: "rejected" }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 화면이 받아 보는 결과 */
export type WriteResult =
  | { ok: true; id: string }
  | { ok: false; reason: DraftProblem | Exclude<GatewayPost, { ok: true }>["reason"] };

/** 글을 올린다 */
// [F1][함수] writePost(raw, gateway): 새 글을 올린다
// 입력: raw(글쓰기 폼 값 묶음) + gateway(PostGateway) → 처리: 도메인 검사 → 표에 저장
// 출력: WriteResult (비동기)
export async function writePost(
  raw: Parameters<typeof readPostDraft>[0],
  gateway: PostGateway,
): Promise<WriteResult> {
  // 받아 줄 만한 글인지는 도메인이 본다
  // [F2][호출] raw → readPostDraft(domain/post-draft) → read
  const read = readPostDraft(raw);

  // 안 되면 까닭만 그대로 올려 보낸다
  // [F3][분기] read.ok → false: 까닭 반환 / true: F4
  if (!read.ok) return { ok: false, reason: read.problem };

  // [F4][외부] read.draft → gateway.publish() ▷ supabase posts insert + set_post_published → saved
  const saved = await gateway.publish(read.draft);

  // [F5][반환] {ok:true, id} → publishPostAction 이 /posts/<id> 로 보낸다
  return saved.ok ? { ok: true, id: saved.id } : { ok: false, reason: saved.reason };
}


/**
 * 이미 올린 글을 고친다.
 *
 * 올릴 때와 **같은 검사**를 거친다. 두 벌로 두면 처음에는 못 올리던 내용이
 * 고치기로는 들어간다 — 규칙에 구멍이 하나 생기는 셈이다.
 *
 * 고치면서 다시 펴내지 않는다. 이미 펴내진 글이라 published 를 건드릴 까닭이 없고,
 * 건드리면 published_at 이 흔들려 최신 탭에서 자리가 바뀐다.
 */
// [F6][함수] revisePost(id, raw, gateway): 이미 올린 글을 고친다
// 입력: id + raw(같은 폼 값) + gateway → 처리: 새 글과 같은 검사 → 표 갱신 → 출력: WriteResult
export async function revisePost(
  id: string,
  raw: Parameters<typeof readPostDraft>[0],
  gateway: PostGateway,
): Promise<WriteResult> {
  // [F7][호출] raw → readPostDraft(domain/post-draft) → read (새 글과 같은 규칙)
  const read = readPostDraft(raw);

  // [F8][분기] read.ok → false: 까닭 반환 / true: F9
  if (!read.ok) return { ok: false, reason: read.problem };

  // [F9][외부] id, read.draft → gateway.revise() ▷ supabase posts update → saved
  const saved = await gateway.revise(id, read.draft);

  // [F10][반환] 결과 → revisePostAction 이 그 글로 되돌려보낸다
  return saved.ok ? { ok: true, id: saved.id } : { ok: false, reason: saved.reason };
}

/**
 * 글을 지운다.
 *
 * 내용을 검사할 것이 없어서 도메인에 물어보지 않는다.
 * 누가 지울 수 있는지는 표(RLS)가 정한다 — 여기서 따지면 두 곳에 규칙이 생긴다.
 */
// [F11][함수] removePost(id, gateway): 글을 지운다
// 입력: id + gateway → 처리: 검사 없이 바로 게이트웨이 → 출력: WriteResult
export async function removePost(
  id: string,
  gateway: PostGateway,
): Promise<WriteResult> {
  // [F12][외부] id → gateway.remove() ▷ supabase posts delete(딸린 댓글·좋아요는 cascade) → done
  const done = await gateway.remove(id);

  // [F13][반환] 결과 → removePostAction 이 /community 로 보낸다
  return done.ok ? { ok: true, id: done.id } : { ok: false, reason: done.reason };
}
