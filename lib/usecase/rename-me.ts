/**
 * 유스케이스 · "내 닉네임을 바꾼다".
 *
 * 닉네임은 남들에게 보이는 이름이다. 그래서 바꾸는 일이 로그인만큼이나
 * 자주 있고, 못 바꾸면 처음 지은 이름에 갇힌다.
 *
 * 규칙(길이 등)은 도메인이 정하고, 어디에 담는지는 게이트웨이가 안다.
 */

import { checkDisplayName, type DisplayNameProblem } from "@/lib/domain/display-name";

/** 프로필을 고쳐 주는 곳이 지켜야 할 약속 */
export type ProfileGateway = {
  /** 지금 로그인한 사람의 닉네임을 바꾼다 */
  rename(name: string): Promise<GatewayRename>;
  /** 지금 로그인한 사람의 닉네임을 읽어 온다. 없으면 null */
  myName(): Promise<string | null>;
};

/** 프로필을 고쳐 주는 곳이 돌려주는 대답 */
export type GatewayRename =
  | { ok: true }
  /** 로그인이 안 되어 있다 */
  | { ok: false; reason: "signed-out" }
  /** 이미 누가 쓰는 이름이다 */
  | { ok: false; reason: "taken" }
  /** 표가 거절했다 */
  | { ok: false; reason: "rejected" }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 화면이 받아 보는 결과 */
export type RenameResult =
  | { ok: true; name: string }
  | { ok: false; reason: DisplayNameProblem | Exclude<GatewayRename, { ok: true }>["reason"] };

/** 닉네임을 바꾼다 */
export async function renameMe(
  raw: string,
  gateway: ProfileGateway,
): Promise<RenameResult> {
  // 받아 줄 만한 이름인지는 도메인이 본다. 가입할 때와 같은 규칙이다
  const read = checkDisplayName(raw);

  if (!read.ok) return { ok: false, reason: read.problem };

  const done = await gateway.rename(read.name);

  return done.ok ? { ok: true, name: read.name } : { ok: false, reason: done.reason };
}
