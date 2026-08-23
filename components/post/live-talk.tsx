"use client";

/**
 * 사람이 쓴 글에 달리는 **진짜 댓글**.
 *
 * 예시 글의 댓글칸([[post-talk]])과 나눠 둔 까닭이 있다. 저쪽은 브라우저에만
 * 쌓여서 남에게 안 보이고, 고치거나 지울 수도 없다. 예시 글이 파일에 있고
 * 표에 없어서 댓글을 걸어 둘 자리가 없기 때문이다.
 *
 * 이쪽은 표에 담긴다. 그래서 할 수 있는 일이 셋이다 — 쓰기·고치기·지우기.
 * 누가 무엇을 할 수 있는지는 **서버가 정해서 내려 준다**(mine·canRemove).
 * 화면이 닉네임을 견줘 정하게 두면 같은 이름을 가진 사람에게 남의 댓글
 * 고치기 단추가 붙는다.
 *
 * 목록 자체는 서버가 그린다. 여기서 다시 불러오지 않는 까닭 —
 * 남기고 나면 서버 액션이 그 화면의 캐시를 비우므로 목록이 알아서 새로 온다.
 */

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import {
  commentAction,
  removeCommentAction,
  reviseCommentAction,
} from "@/app/actions/post";
import { emptyTalkState } from "@/app/actions/post-state";
import { avatarLetter } from "@/lib/domain/avatar";
import { MAX_COMMENT } from "@/lib/domain/post";
import type { LiveComment } from "@/lib/usecase/discuss-post";
import { commentMessages, postCopy } from "@/lib/post-copy";

type Props = {
  /** 어느 글에 다는 것인지 */
  postId: string;
  /** 서버가 읽어 온 댓글들. 시간 순으로 와 있다 */
  comments: readonly LiveComment[];
  /** 로그인했는지. 안 했으면 쓰는 칸 대신 로그인 안내를 놓는다 */
  signedIn: boolean;
};

// [F1][함수] LiveTalk({postId, comments, signedIn}): 표에 담기는 진짜 댓글 칸
// 입력: postId + comments(서버가 reader:F14 로 읽어 넘긴 목록) + signedIn
// 처리: 쓰기 폼 + 줄마다 LiveLine → 출력: 화면(JSX)
// 목록은 서버가 그린다 — 남기고 나면 revalidatePath 로 새로 온다
export function LiveTalk({ postId, comments, signedIn }: Props) {
  /* 서버로 보내고 돌아온 쪽지 */
  // [F2][흐름] useActionState(commentAction) → state · action · pending
  // 폼 제출 → ▷ commentAction(app/actions/post.ts:F17)
  const [state, action, pending] = useActionState(commentAction, emptyTalkState);

  /* 입력칸에 적혀 있는 글자 */
  // [F3][흐름] 입력칸 글자 → draft
  const [draft, setDraft] = useState("");

  /* 잘 남겨졌으면 입력칸을 비운다.
     `state.at` 은 누를 때마다 하나씩 오르는 값이라, 두 번 이어서 잘돼도 달라진다 —
     reason 만 보면 두 번째부터 칸이 안 비워진다.
     상태를 그리는 도중이 아니라 서버 대답이 온 뒤에 바꾸므로 여기서 해도 된다 */
  // [F4][흐름] 마지막으로 '잘됐다' 를 본 시도 번호 → doneAt (같은 성공을 두 번 안 세려고)
  const doneAt = useRef(0);
  // [F5][분기] state.at 이 늘었고 reason 이 null(=방금 잘됨) → true: 입력칸을 비운다
  // state.at 을 보는 까닭 — reason 만 보면 두 번 이어서 잘됐을 때 쪽지가 똑같다
  useEffect(() => {
    if (state.at > doneAt.current && state.reason === null) {
      doneAt.current = state.at;
      setDraft("");
    }
  }, [state]);

  return (
    <section className="pd-talk" aria-label={postCopy.talkLabel}>
      <h2 className="pd-rh">
        <span className="pd-rh-ico" aria-hidden="true">
          <Icon name="chat" size={18} />
        </span>
        {postCopy.talkLabel}
        <span className="pd-talk-n">{comments.length}</span>
      </h2>

      {/* 쓰는 칸을 목록 위에 둔다. 읽고 나서 쓰는 사람보다 바로 쓰려는 사람이 많다 */}
      {signedIn ? (
        <form className="pd-write" action={action}>
          {/* 어느 글에 다는지. 사람이 고칠 값이 아니라 숨겨 둔다 */}
          <input type="hidden" name="postId" value={postId} />

          <label className="pd-write-l" htmlFor="pd-write-box">
            {postCopy.writeLabel}
          </label>

          <textarea
            className="pd-write-box"
            id="pd-write-box"
            name="body"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            /* 도메인이 정한 위쪽 한계를 입력칸에도 알려 준다.
               막아 두는 것과 별개로, 세다가 넘으면 브라우저가 먼저 알려 준다 */
            maxLength={MAX_COMMENT}
          />

          <div className="pd-write-foot">
            {/* 돌려보낸 까닭. 없으면 자리만 비워 둬서 단추가 움직이지 않게 한다 */}
            <p className="pd-write-msg" role="status">
              {state.reason ? commentMessages[state.reason] : ""}
            </p>

            <button className="pd-write-send" type="submit" disabled={pending}>
              {postCopy.writeSend}
            </button>
          </div>
        </form>
      ) : (
        <p className="pd-write-need">
          {postCopy.needLogin}{" "}
          <Link href={`/login?next=/posts/${postId}`}>{postCopy.needLoginGo}</Link>
        </p>
      )}

      {/* 한 줄도 없을 때는 빈 자리 대신 안내를 놓는다 */}
      {comments.length === 0 && <p className="pd-talk-empty">{postCopy.talkEmpty}</p>}

      <ul className="pd-cmts">
        {comments.map((c) => (
          <LiveLine key={c.id} postId={postId} comment={c} />
        ))}
      </ul>
    </section>
  );
}

/** 댓글 한 줄. 내 것이면 고치기·지우기가 붙는다 */
// [F6][함수] LiveLine({postId, comment}): 댓글 한 줄. 내 것이면 고치기·지우기가 붙는다
// 입력: comment(mine·canRemove 는 서버가 정해 넘긴 값) → 출력: 화면(JSX)
function LiveLine({ postId, comment }: { postId: string; comment: LiveComment }) {
  /* 지금 고치는 중인지. 줄마다 따로 쥔다 — 한곳에서 쥐면
     어느 줄을 고치는 중인지 부모가 알아야 하고, 그만큼 다시 그릴 범위가 넓어진다 */
  // [F7][흐름] 지금 고치는 중인지 → editing (줄마다 따로 쥔다)
  const [editing, setEditing] = useState(false);

  /* 고치기 폼이 서버와 주고받는 쪽지 */
  // [F8][흐름] useActionState(reviseCommentAction) → 고치기 폼이 쓸 state · action
  // 폼 제출 → ▷ reviseCommentAction(app/actions/post.ts:F21)
  const [state, action, pending] = useActionState(reviseCommentAction, emptyTalkState);

  /* 지우는 동안 */
  // [F9][흐름] useTransition() → busy · start (지우기를 감싸 부른다)
  const [busy, start] = useTransition();

  /* 잘 고쳐졌으면 고치기 칸을 닫는다. 안 닫으면 고쳐 놓고도 계속 칸이 열려 있다 */
  const doneAt = useRef(0);
  // [F10][분기] 방금 잘 고쳐졌으면 → true: 고치기 칸을 닫는다
  useEffect(() => {
    if (state.at > doneAt.current && state.reason === null) {
      doneAt.current = state.at;
      setEditing(false);
    }
  }, [state]);

  /** 이 줄을 지운다 */
  // [F11][함수] onDrop(): 이 줄을 지운다
  // 입력: 없음 → 처리: confirm 후 ▷ removeCommentAction(app/actions/post.ts:F23) → 출력: 없음
  function onDrop() {
    // 되돌릴 수 없는 일이라 한 번 더 물어본다
    if (!window.confirm(postCopy.removeCommentAsk)) return;

    start(() => {
      void removeCommentAction(comment.id, postId);
    });
  }

  return (
    <li className={comment.mine ? "pd-cmt pd-cmt-mine" : "pd-cmt"}>
      {/* 프로필 사진. 없으면 이름 첫 글자를 딴 동그란 표시로 대신한다 */}
      {comment.avatar ? (
        <Image
          className="pd-cmt-face"
          src={comment.avatar}
          alt=""
          width={36}
          height={36}
          /* 우리 스토리지 주소라 next/image 가 줄여 주지 못한다.
             올릴 때 이미 256px 로 줄여 두어서 그대로 내보내도 된다 */
          unoptimized
        />
      ) : (
        <span className="pd-cmt-mark" aria-hidden="true">
          {avatarLetter(comment.who)}
        </span>
      )}

      <div className="pd-cmt-body">
        <p className="pd-cmt-head">
          <strong>{comment.who}</strong>
          <span className="pd-cmt-when">{comment.when}</span>

          {/* 고친 적이 있으면 밝힌다. 안 밝히면 말이 조용히 바뀐다 */}
          {comment.edited && <span className="pd-cmt-edited">{postCopy.editedMark}</span>}

          {comment.mine && <span className="pd-cmt-tag">{postCopy.mineMark}</span>}
        </p>

        {editing ? (
          /* 고치는 중. 같은 자리에서 바로 고친다 — 다른 화면으로 보내면
             어느 줄을 고치는 중이었는지 잊어버린다 */
          <form className="pd-cmt-edit" action={action}>
            <input type="hidden" name="postId" value={postId} />
            <input type="hidden" name="commentId" value={comment.id} />

            <label className="sr-only" htmlFor={`edit-${comment.id}`}>
              {postCopy.edit}
            </label>
            <textarea
              className="pd-write-box"
              id={`edit-${comment.id}`}
              name="body"
              defaultValue={comment.text}
              rows={3}
              maxLength={MAX_COMMENT}
            />

            {state.reason && (
              <p className="pd-write-msg" role="status">
                {commentMessages[state.reason]}
              </p>
            )}

            <div className="pd-cmt-edit-foot">
              <button
                className="btn btn-line btn-sm"
                type="button"
                onClick={() => setEditing(false)}
              >
                {postCopy.cancel}
              </button>

              <button className="btn btn-fill btn-sm" type="submit" disabled={pending}>
                {postCopy.saveEdit}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="pd-cmt-text">{comment.text}</p>

            {/* 손볼 수 있는 것만 그린다. 남의 댓글에는 아무것도 안 붙는다 */}
            {(comment.mine || comment.canRemove) && (
              <p className="pd-cmt-acts">
                {comment.mine && (
                  <button type="button" onClick={() => setEditing(true)}>
                    <Icon name="pencil" size={13} /> {postCopy.edit}
                  </button>
                )}

                {comment.canRemove && (
                  <button type="button" onClick={onDrop} disabled={busy}>
                    <Icon name="trash" size={13} /> {postCopy.remove}
                  </button>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </li>
  );
}
