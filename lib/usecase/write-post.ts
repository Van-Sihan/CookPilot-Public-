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
export async function writePost(
  raw: Parameters<typeof readPostDraft>[0],
  gateway: PostGateway,
): Promise<WriteResult> {
  // 받아 줄 만한 글인지는 도메인이 본다
  const read = readPostDraft(raw);

  // 안 되면 까닭만 그대로 올려 보낸다
  if (!read.ok) return { ok: false, reason: read.problem };

  const saved = await gateway.publish(read.draft);

  return saved.ok ? { ok: true, id: saved.id } : { ok: false, reason: saved.reason };
}
