/**
 * 프레임워크 계층 · 글쓰기·닉네임 폼이 서버와 주고받는 쪽지의 생김새.
 *
 * [[auth-state]] 와 같은 까닭으로 따로 둔다 — "use server" 파일은
 * async 함수 말고는 아무것도 내보낼 수 없다.
 */

// [F1][데이터] 글쓰기·닉네임·댓글·사진 폼이 서버와 주고받는 쪽지의 생김새(타입 선언만)
// 실행 흐름 없음. 쓰는 곳: app/actions/post.ts · components/write·post/*
// at(시도 번호)를 함께 두는 까닭 — 잘됐을 때도 쪽지가 달라져야 화면이 알아챈다

import type { TalkResult } from "@/lib/usecase/discuss-post";
import type { PhotoResult, RenameResult } from "@/lib/usecase/rename-me";
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


/** 댓글 폼과 서버가 주고받는 쪽지 */
export type TalkFormState = {
  /** 왜 안 됐는지. 잘됐거나 아직 아무것도 안 눌렀으면 null */
  reason: Extract<TalkResult, { ok: false }>["reason"] | null;
  /**
   * 몇 번째 시도인지.
   *
   * 잘됐을 때도 값이 바뀌어야 화면이 "방금 됐다" 를 알아챈다.
   * reason 만 두면 두 번 이어서 잘됐을 때 쪽지가 `{reason:null}` 로 똑같아서,
   * 입력칸을 비우는 일이 두 번째부터 안 일어난다.
   */
  at: number;
};

/** 아직 아무것도 안 눌렀을 때 */
export const emptyTalkState: TalkFormState = { reason: null, at: 0 };

/** 프로필 사진 폼과 서버가 주고받는 쪽지 */
export type PhotoFormState = {
  reason: Extract<PhotoResult, { ok: false }>["reason"] | null;
  /** 바뀐 사진 주소. 뗐으면 null */
  url: string | null;
  at: number;
};

/** 아직 아무것도 안 눌렀을 때 */
export const emptyPhotoState: PhotoFormState = { reason: null, url: null, at: 0 };
