"use client";

/**
 * 글 아래 후기 칸.
 *
 * 미리 달려 있는 줄(글마다 정해 둔 것)과 내가 쓴 줄(브라우저에 쌓인 것)을
 * 이어 붙여 보여 준다. 내가 쓴 것이 아래로 간다 — 방금 남긴 줄이 눈에 띄어야 한다.
 *
 * **내가 쓴 후기는 이 브라우저에만 담긴다.** 남에게는 안 보인다.
 * 그 사실을 화면에 적어 두었다. 올라간 줄 알았는데 아니었던 쪽이 더 나쁘다.
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { browserCommentStore } from "@/lib/adapter/browser-comment-store";
import { MAX_COMMENT, type PostComment } from "@/lib/domain/post";
import { findMyComments, sayOnPost, watchComments } from "@/lib/usecase/discuss-post";
import { commentMessages, postCopy } from "@/lib/post-copy";

type Props = {
  /** 어느 글에 다는 것인지 */
  postId: string;
  /** 글마다 정해 둔, 미리 달려 있는 줄들 */
  given: readonly PostComment[];
  /** 지금 로그인한 사람의 이름. 없으면 "손님" 으로 남는다 */
  me: string;
};

export function PostTalk({ postId, given, me }: Props) {
  /* 담아 둔 것이 바뀌면 알려 달라고 부탁하는 함수.
     화면을 다시 그릴 때마다 새로 만들면 부탁했다 취소했다를 되풀이한다 */
  const watch = useCallback(
    (fn: () => void) => watchComments(browserCommentStore, fn),
    [],
  );

  /* 내가 쓴 줄. 브라우저 저장 공간에 있어서 "바깥 값 지켜보기" 로 따라간다 */
  const mine = useSyncExternalStore(
    watch,
    () => findMyComments(browserCommentStore, postId),
    // 서버에는 저장 공간이 없으니 늘 빈 목록으로 본다
    () => EMPTY,
  );

  /* 입력칸에 지금 적혀 있는 글자 */
  const [draft, setDraft] = useState("");

  /* 돌려보냈을 때 밑에 뜨는 말. 없으면 null */
  const [problem, setProblem] = useState<string | null>(null);

  /** 남기기를 눌렀을 때 */
  function onSend(event: React.FormEvent) {
    // 폼이 통째로 새로 고쳐지는 것을 막는다. 그러면 적던 글이 사라진다
    event.preventDefault();

    const result = sayOnPost(browserCommentStore, postId, draft, me);

    // 안 됐으면 까닭에 맞는 말을 붙이고 적던 글은 그대로 둔다
    if (!result.ok) {
      setProblem(commentMessages[result.problem]);
      return;
    }

    // 됐으면 입력칸을 비우고 밑에 떠 있던 말도 거둔다
    setDraft("");
    setProblem(null);
  }

  /* 다 합친 줄 수. 제목 옆에 숫자를 붙여 준다 */
  const count = given.length + mine.length;

  return (
    <section className="pd-talk" aria-label={postCopy.talkLabel}>
      <h2 className="pd-rh">
        <span className="pd-rh-ico" aria-hidden="true">
          <Icon name="chat" size={18} />
        </span>
        {postCopy.talkLabel}
        <span className="pd-talk-n">{count}</span>
      </h2>

      {/* 쓰는 칸을 목록 위에 둔다. 읽고 나서 쓰는 사람보다 바로 쓰려는 사람이 많다 */}
      <form className="pd-write" onSubmit={onSend}>
        <label className="pd-write-l" htmlFor="pd-write-box">
          {postCopy.writeLabel}
        </label>

        <textarea
          className="pd-write-box"
          id="pd-write-box"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={postCopy.writePlaceholder}
          rows={3}
          /* 도메인이 정한 위쪽 한계를 입력칸에도 알려 준다.
             막아 두는 것과 별개로, 세다가 넘으면 브라우저가 먼저 알려 준다 */
          maxLength={MAX_COMMENT}
        />

        <div className="pd-write-foot">
          {/* 돌려보낸 까닭. 없으면 자리만 비워 둬서 단추가 움직이지 않게 한다 */}
          <p className="pd-write-msg" role="status">
            {problem}
          </p>

          <button className="pd-write-send" type="submit">
            {postCopy.writeSend}
          </button>
        </div>

        {/* 어디에 담기는지 숨기지 않는다 */}
        <p className="pd-write-note">{postCopy.writeNote}</p>
      </form>

      {/* 한 줄도 없을 때는 빈 자리 대신 안내를 놓는다 */}
      {count === 0 && <p className="pd-talk-empty">{postCopy.talkEmpty}</p>}

      <ul className="pd-cmts">
        {given.map((c) => (
          <Line key={c.id} comment={c} />
        ))}

        {/* 내가 쓴 것은 뒤에, 표시를 달아서 */}
        {mine.map((c) => (
          <Line key={c.id} comment={c} mine />
        ))}
      </ul>
    </section>
  );
}

/** 후기 한 줄. 미리 달린 것과 내가 쓴 것이 똑같이 쓴다 */
function Line({ comment, mine }: { comment: PostComment; mine?: boolean }) {
  return (
    <li className={mine ? "pd-cmt pd-cmt-mine" : "pd-cmt"}>
      {/* 사진이 없으니 이름 첫 글자를 딴 동그란 표시로 대신한다 */}
      <span className="pd-cmt-mark" aria-hidden="true">
        {comment.who.slice(0, 1)}
      </span>

      <div className="pd-cmt-body">
        <p className="pd-cmt-head">
          <strong>{comment.who}</strong>
          <span className="pd-cmt-when">{comment.when}</span>
          {mine && <span className="pd-cmt-tag">{postCopy.mineMark}</span>}
        </p>

        <p className="pd-cmt-text">{comment.text}</p>
      </div>
    </li>
  );
}

/**
 * 서버에서 그릴 때 돌려주는 빈 목록.
 *
 * `[]` 를 그때그때 만들면 안 된다. React 가 지난번 값과 `===` 로 견주는데
 * 빈 배열도 만들 때마다 다른 값이라 끝없이 다시 그린다.
 */
const EMPTY: readonly PostComment[] = Object.freeze([]);
