"use client";

/**
 * 글 밑에 붙는 단추 줄 — 좋아요 · 저장 · (내 글이면) 고치기 · 지우기.
 *
 * 브라우저에서 도는 몇 안 되는 자리다. 누르는 순간 화면이 먼저 바뀌어야 하기
 * 때문이다. 서버가 대답할 때까지 기다렸다 바꾸면, 하트를 눌러 놓고
 * "눌린 건가?" 하며 한 번 더 누르게 된다.
 *
 * **먼저 바꾸고 나중에 되돌린다.** 눌린 모습을 바로 보여 주고, 서버가
 * 안 됐다고 하면 그때 되돌린다. 반대로 하면 느린 인터넷에서 단추가 죽은 것처럼 보인다.
 */

import Link from "next/link";
import { useState, useTransition } from "react";
import { Icon } from "@/components/icons";
import { bookmarkAction, likeAction, removePostAction } from "@/app/actions/post";
import { postCopy } from "@/lib/post-copy";

type Props = {
  /** 어느 글인지 */
  postId: string;
  /** 지금 좋아요 수. 서버가 세어 준 값 */
  likes: number;
  /** 내가 눌러 뒀는지 */
  liked: boolean;
  /** 내가 저장해 뒀는지 */
  saved: boolean;
  /** 로그인했는지. 안 했으면 누를 수 없다 */
  signedIn: boolean;
  /** 내 글인지. 고치기·지우기 단추를 붙일지 정한다 */
  mine: boolean;
};

// [F1][함수] PostActions({...}): 글 밑 단추 줄(좋아요·저장·고치기·지우기)
// 입력: postId + likes·liked·saved(서버가 읽어 준 값) + signedIn + mine
// 처리: 누르면 화면을 먼저 바꾸고 서버에 알린다 → 출력: 화면(JSX)
export function PostActions({ postId, likes, liked, saved, signedIn, mine }: Props) {
  /* 화면에 보이는 값. 서버가 준 값으로 시작해서, 누르면 여기부터 바뀐다 */
  // [F2][흐름] 서버가 준 값으로 시작 → onLike · count · onSave (누르면 여기부터 바뀐다)
  const [onLike, setOnLike] = useState(liked);
  const [count, setCount] = useState(likes);
  const [onSave, setOnSave] = useState(saved);

  /* 안 됐을 때 밑에 뜨는 말 */
  const [note, setNote] = useState<string | null>(null);

  /* 서버에 다녀오는 동안. Server Action 을 부르는 일은 화면 다시 그리기와
     엮여 있어서 useTransition 으로 감싸야 한다 */
  // [F3][흐름] useTransition() → busy(다녀오는 중) · start(Server Action 을 감싸 부르는 함수)
  const [busy, start] = useTransition();

  /** 좋아요를 뒤집는다 */
  // [F4][함수] onHeart(): 하트를 눌렀을 때
  // 입력: 없음 → 처리: 화면 먼저 바꾸고 likeAction 호출, 실패하면 되돌림 → 출력: 없음
  function onHeart() {
    // 로그인 안 했으면 누를 자리가 없다. 왜 안 되는지만 알려 준다
    // [F5][분기] 로그인 안 함 → true: '로그인해야 누를 수 있습니다' 만 띄우고 멈춤 / false: F6
    if (!signedIn) {
      setNote(postCopy.reactNeedsLogin);
      return;
    }

    // [F6][흐름] !onLike → next → setOnLike/setCount 로 **먼저** 화면을 바꾼다
    const next = !onLike;

    // 먼저 바꾼다. 서버는 나중에 따라온다
    setOnLike(next);
    setCount((n) => (next ? n + 1 : Math.max(0, n - 1)));
    setNote(null);

    start(async () => {
      // [F7][외부] postId, next ▷ likeAction(app/actions/post.ts:F25) → result
      const result = await likeAction(postId, next);

      // 안 됐으면 눌리기 전으로 되돌린다. 안 되돌리면 화면과 표가 어긋난 채 남는다
      // [F8][분기] result.ok → false: 눌리기 전으로 **되돌린다**(화면과 표가 어긋나면 안 된다)
      if (!result.ok) {
        setOnLike(!next);
        setCount((n) => (next ? Math.max(0, n - 1) : n + 1));
        setNote(postCopy.reactNeedsLogin);
      }
    });
  }

  /** 즐겨찾기를 뒤집는다 */
  // [F9][함수] onMark(): 저장(즐겨찾기)을 눌렀을 때
  // 입력: 없음 → 처리: onHeart 와 같은 방식으로 bookmarkAction 호출 → 출력: 없음
  function onMark() {
    if (!signedIn) {
      setNote(postCopy.reactNeedsLogin);
      return;
    }

    const next = !onSave;

    setOnSave(next);
    setNote(null);

    start(async () => {
      // [F10][외부] postId, next ▷ bookmarkAction(app/actions/post.ts:F27) → result
      const result = await bookmarkAction(postId, next);

      if (!result.ok) {
        setOnSave(!next);
        setNote(postCopy.reactNeedsLogin);
      }
    });
  }

  /** 글을 지운다 */
  // [F11][함수] onDrop(): '지우기' 를 눌렀을 때
  // 입력: 없음 → 처리: confirm 으로 한 번 더 물은 뒤 removePostAction → 출력: 없음
  function onDrop() {
    /* 되돌릴 수 없는 일이라 한 번 더 물어본다.
       무엇이 함께 사라지는지도 같이 적어 둔다 — 댓글까지 없어진다는 것을
       모르고 누르는 사람이 있다 */
    // [F12][분기] confirm 에서 '아니오' → true: 아무것도 안 함 / false: F13
    if (!window.confirm(postCopy.removeAsk)) return;

    start(async () => {
      /* 잘되면 이 함수 안에서 목록으로 넘어간다(서버가 redirect 를 던진다).
         그래서 아래 줄은 안 됐을 때만 돌아온다 */
      // [F13][외부] postId ▷ removePostAction(app/actions/post.ts:F14)
      // 잘되면 서버가 redirect 를 던져 /community 로 간다. 아래 줄은 실패했을 때만 온다
      const result = await removePostAction(postId);

      if (!result.ok) setNote(postCopy.reactNeedsLogin);
    });
  }

  return (
    <div className="pd-acts">
      <div className="pd-acts-row">
        {/* 좋아요. 눌리면 하트가 차오른다 */}
        <button
          className="pd-act"
          type="button"
          onClick={onHeart}
          disabled={busy}
          // 지금 눌려 있는지 읽어 주는 기계에도 알린다
          aria-pressed={onLike}
          data-on={onLike ? "" : undefined}
        >
          <Icon name="heart" size={17} />
          {onLike ? postCopy.liked : postCopy.like}
          <span className="pd-act-n">{count}</span>
        </button>

        {/* 즐겨찾기. 나만 보는 값이라 숫자를 안 붙인다 */}
        <button
          className="pd-act"
          type="button"
          onClick={onMark}
          disabled={busy}
          aria-pressed={onSave}
          data-on={onSave ? "" : undefined}
        >
          <Icon name="bookmark" size={17} />
          {onSave ? postCopy.saved : postCopy.save}
        </button>

        {/* 내 글에만 붙는 둘. 남의 글에서는 아예 안 그린다 —
            눌러도 표가 막지만, 보이면 누를 수 있다고 여긴다 */}
        {mine && (
          <>
            <Link className="pd-act pd-act-quiet" href={`/posts/${postId}/edit`}>
              <Icon name="pencil" size={16} />
              {postCopy.edit}
            </Link>

            <button
              className="pd-act pd-act-quiet pd-act-drop"
              type="button"
              onClick={onDrop}
              disabled={busy}
            >
              <Icon name="trash" size={16} />
              {postCopy.remove}
            </button>
          </>
        )}
      </div>

      {/* 안 됐을 때 까닭. 자리를 늘 비워 두지 않고 있을 때만 그린다 */}
      {note && (
        <p className="pd-acts-note" role="status">
          {note}{" "}
          {!signedIn && <Link href={`/login?next=/posts/${postId}`}>{postCopy.needLoginGo}</Link>}
        </p>
      )}
    </div>
  );
}
