/**
 * 유스케이스 · "글에 댓글을 남기기".
 *
 * 도메인이 "받아 줄 만한 댓글인가" 를 보고, 이 파일이 "그래서 어디에 쌓을 것인가" 를 맡는다.
 * localStorage 라는 말은 여기 한 번도 안 나온다 — CommentStore 뒤에 있다.
 *
 * 지금 담기는 곳은 브라우저다. 즉 **내가 쓴 댓글은 나만 본다.**
 * 남들에게도 보이게 하려면 이 파일이 아니라 어댑터만 수파베이스로 갈아 끼우면 된다.
 * 그러라고 저장소를 인터페이스로 뒤집어 두었다.
 */

import { checkComment, type CommentProblem, type PostComment } from "@/lib/domain/post";

/**
 * 댓글을 담아 두는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다.
 *
 * 글 하나가 아니라 글 전체를 한 덩어리로 다룬다. 글마다 저장 칸을 따로 만들면
 * 어느 칸이 있는지 세어 보기 어렵고, 지울 때도 하나씩 찾아 지워야 한다.
 */
export type CommentStore = {
  /** 그 글에 내가 쌓아 둔 댓글. 없으면 빈 목록 */
  load(postId: string): readonly PostComment[];
  /** 한 줄 쌓는다 */
  add(postId: string, comment: PostComment): void;
  /** 바뀌면 알려 준다. 돌려주는 함수를 부르면 그만 본다 */
  subscribe(onChange: () => void): () => void;
};

/** 화면이 받아 보는 결과 */
export type SayResult =
  | { ok: true; comment: PostComment }
  | { ok: false; problem: CommentProblem | "storage" };

/**
 * 댓글 한 줄을 남긴다.
 *
 * id 와 시각은 화면이 아니라 여기서 만든다. 화면이 만들게 두면 화면마다
 * 다른 방식으로 만들게 되고, 그러다 id 가 겹치면 목록에서 두 줄이 한 줄로 접힌다.
 */
export function sayOnPost(
  store: CommentStore,
  postId: string,
  raw: string,
  who: string,
): SayResult {
  // 받아 줄 만한 글인지는 도메인이 본다
  const read = checkComment(raw);

  // 안 되면 까닭만 그대로 올려 보낸다. 무슨 말로 보여 줄지는 화면이 고른다
  if (!read.ok) return { ok: false, problem: read.problem };

  /* 언제 썼는지를 "방금 전" 이 아니라 날짜로 적어 둔다.
     "방금 전" 은 담는 순간에는 맞지만 내일 열어 봐도 "방금 전" 이라 거짓말이 된다.
     날짜는 언제 봐도 맞다. 지금 시각을 보는 일은 화면을 그리는 중이 아니라
     단추를 눌렀을 때 일어나므로 다시 그리기를 어지럽히지 않는다 */
  const now = new Date();

  const comment: PostComment = {
    /* 시각과 무작위 글자를 붙여 id 를 만든다. 시각만 쓰면 같은 밀리초에 두 번
       눌렀을 때 겹치고, 무작위만 쓰면 순서를 알 수 없다 */
    id: `me-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    who,
    // 올해 안의 일이 대부분이라 연도는 접어 둔다
    when: `${now.getMonth() + 1}월 ${now.getDate()}일`,
    text: read.text,
  };

  try {
    store.add(postId, comment);
  } catch {
    /* 저장을 막아 둔 브라우저(시크릿 창 등)에서는 여기로 온다.
       화면에만 띄우고 담기지 않으면 새로 고쳤을 때 말없이 사라지므로,
       담지 못했다는 사실을 그대로 알려 준다 */
    return { ok: false, problem: "storage" };
  }

  return { ok: true, comment };
}

/** 그 글에 내가 쌓아 둔 댓글을 꺼낸다 */
export function findMyComments(
  store: CommentStore,
  postId: string,
): readonly PostComment[] {
  try {
    return store.load(postId);
  } catch {
    // 못 읽는 상황은 "쓴 적 없다" 와 똑같이 본다
    return NO_COMMENTS;
  }
}

/** 댓글이 바뀌는지 지켜본다 */
export function watchComments(store: CommentStore, onChange: () => void) {
  return store.subscribe(onChange);
}

/**
 * 아무것도 없을 때 돌려주는 빈 목록.
 *
 * `[]` 를 그때그때 새로 만들면 안 된다. React 가 지난번 값과 `===` 로 견주는데
 * 빈 배열도 만들 때마다 다른 값이라, 내용이 그대로여도 끝없이 다시 그린다.
 */
export const NO_COMMENTS: readonly PostComment[] = Object.freeze([]);
