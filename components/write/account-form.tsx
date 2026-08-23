"use client";

/**
 * 닉네임 바꾸는 칸.
 *
 * 이메일은 보여 주기만 하고 못 고친다. 로그인에 쓰는 값이라 바꾸려면
 * 확인 메일을 다시 받아야 하는데, 그건 이 화면이 할 일이 아니다.
 */

import { useActionState, useState } from "react";
import { renameAction } from "@/app/actions/post";
import { emptyRenameState } from "@/app/actions/post-state";
import { MAX_DISPLAY_NAME } from "@/lib/domain/display-name";
import { accountCopy, renameMessages } from "@/lib/write-content";

type Props = {
  /** 로그인한 이메일. 보여 주기만 한다 */
  email: string;
  /** 지금 닉네임. 칸에 미리 채워 둔다 */
  name: string;
};

// [F1][함수] AccountForm({email, name}): 닉네임 바꾸는 칸
// 입력: email(보여 주기만) + name(지금 닉네임) → 처리: renameAction 에 넘김 → 출력: 화면(JSX)
export function AccountForm({ email, name }: Props) {
  // [F2][흐름] useActionState(renameAction) → state · action · pending
  // 폼 제출 → ▷ renameAction(app/actions/post.ts:F7) → renameMe(usecase:F1)
  const [state, action, pending] = useActionState(renameAction, emptyRenameState);

  /* 적고 있는 이름. 서버가 돌려준 값으로 덮지 않는다 —
     덮으면 사람이 고치던 글자가 사라진다 */
  // [F3][흐름] 입력칸 글자 → typed (서버가 준 값으로 덮지 않는다. 덮으면 고치던 글이 사라진다)
  const [typed, setTyped] = useState(name);

  return (
    <form className="wr" action={action}>
      <p className="wr-l">이메일</p>
      {/* 못 고치는 값이라 입력칸이 아니라 그냥 글자로 둔다 */}
      <p className="ac-email">{email}</p>

      <label className="wr-l" htmlFor="ac-name">
        {accountCopy.nameLabel}
      </label>
      <input
        className="wr-input"
        id="ac-name"
        name="name"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        placeholder={accountCopy.namePlaceholder}
        maxLength={MAX_DISPLAY_NAME}
        autoComplete="nickname"
      />

      {/* 바뀌었으면 알려 준다. 화면이 안 바뀌면 눌린 건지 알 수 없다 */}
      {state.done && (
        <p className="wr-ok" role="status">
          {accountCopy.done} {state.done}
        </p>
      )}

      {state.reason && (
        <p className="wr-error" role="status">
          {renameMessages[state.reason]}
        </p>
      )}

      <div className="wr-foot">
        <button className="btn btn-fill" type="submit" disabled={pending}>
          {pending ? accountCopy.saving : accountCopy.save}
        </button>
      </div>
    </form>
  );
}
