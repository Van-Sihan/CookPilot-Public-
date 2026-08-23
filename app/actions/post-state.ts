/**
 * 프레임워크 계층 · 글쓰기·닉네임 폼이 서버와 주고받는 쪽지의 생김새.
 *
 * [[auth-state]] 와 같은 까닭으로 따로 둔다 — "use server" 파일은
 * async 함수 말고는 아무것도 내보낼 수 없다.
 */

import type { RenameResult } from "@/lib/usecase/rename-me";
import type { WriteResult } from "@/lib/usecase/write-post";

/** 글쓰기 폼과 서버가 주고받는 쪽지 */
export type WriteFormState = {
  /** 왜 안 됐는지. 잘됐거나 아직 아무것도 안 눌렀으면 null */
  reason: Extract<WriteResult, { ok: false }>["reason"] | null;
};

/** 아직 아무것도 안 눌렀을 때의 쪽지 */
export const emptyWriteState: WriteFormState = { reason: null };

/** 닉네임 폼과 서버가 주고받는 쪽지 */
export type RenameFormState = {
  reason: Extract<RenameResult, { ok: false }>["reason"] | null;
  /** 바뀐 이름. 바뀐 뒤에 "○○ 으로 바꿨습니다" 라고 알려 주려고 담는다 */
  done: string | null;
};

/** 아직 아무것도 안 눌렀을 때 */
export const emptyRenameState: RenameFormState = { reason: null, done: null };
