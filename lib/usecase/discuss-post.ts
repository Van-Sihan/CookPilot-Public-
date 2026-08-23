/**
 * 유스케이스 · "글에 댓글을 남기기".
 *
 * 도메인이 "받아 줄 만한 댓글인가" 를 보고, 이 파일이 "그래서 어디에 쌓을 것인가" 를 맡는다.
 *
 * 담기는 곳이 둘이다. 갈라 둔 까닭이 있다.
 *
 *   · **표(수파베이스)** — 사람이 쓴 글에 달리는 진짜 댓글. 남에게도 보이고
 *     고치고 지울 수 있다. 아래 CommentGateway 가 이쪽이다.
 *   · **브라우저** — 예시 글 열여섯 편에 달리는 댓글. 그 글들은 파일에 있고
 *     표에 없어서 표에 댓글을 달 자리가 없다. CommentStore 가 이쪽이다.
 *
 * 하나로 합치려면 예시 글을 먼저 표로 옮겨야 한다. 그 일을 하기 전까지는
 * 두 길이 남는다 — 억지로 합치면 예시 글 id 로 아무 줄이나 만들 수 있게 된다.
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
// [F1][함수] sayOnPost(store, postId, raw, who): 예시 글에 브라우저 댓글을 남긴다
// 입력: store(CommentStore) + postId + raw(입력칸 글자) + who(내 이름)
// 처리: 도메인 검사 → id·시각 생성 → 저장 → 출력: SayResult
export function sayOnPost(
  store: CommentStore,
  postId: string,
  raw: string,
  who: string,
): SayResult {
  // 받아 줄 만한 글인지는 도메인이 본다
  // [F2][호출] raw → checkComment(domain/post) → read
  const read = checkComment(raw);

  // 안 되면 까닭만 그대로 올려 보낸다. 무슨 말로 보여 줄지는 화면이 고른다
  // [F3][분기] read.ok → false: 까닭 반환 / true: F4
  if (!read.ok) return { ok: false, problem: read.problem };

  /* 언제 썼는지를 "방금 전" 이 아니라 날짜로 적어 둔다.
     "방금 전" 은 담는 순간에는 맞지만 내일 열어 봐도 "방금 전" 이라 거짓말이 된다.
     날짜는 언제 봐도 맞다. 지금 시각을 보는 일은 화면을 그리는 중이 아니라
     단추를 눌렀을 때 일어나므로 다시 그리기를 어지럽히지 않는다 */
  // [F4][흐름] 지금 시각 → now (id 와 '몇월 몇일' 을 여기서 만든다)
  const now = new Date();

  // [F5][흐름] read.text + who + now → comment(PostComment)
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
    // [F6][외부] comment → store.add() ▷ localStorage(cookpilot.comments) 기록
    store.add(postId, comment);
  } catch {
    /* 저장을 막아 둔 브라우저(시크릿 창 등)에서는 여기로 온다.
       화면에만 띄우고 담기지 않으면 새로 고쳤을 때 말없이 사라지므로,
       담지 못했다는 사실을 그대로 알려 준다 */
    // [F7][에러] 저장이 막힘 → 'storage' 반환 → post-talk 이 시크릿 창 안내를 띄운다
    return { ok: false, problem: "storage" };
  }

  // [F8][반환] {ok:true, comment} → post-talk 이 입력칸을 비운다
  return { ok: true, comment };
}

/** 그 글에 내가 쌓아 둔 댓글을 꺼낸다 */
// [F9][함수] findMyComments(store, postId): 그 글에 내가 쌓아 둔 댓글을 꺼낸다
// 입력: store + postId → 처리: store.load() ▷ localStorage 읽기 → 출력: PostComment[]
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
// [F10][함수] watchComments(store, onChange): 브라우저 댓글이 바뀌는지 지켜본다
// 입력: store + onChange → 처리: store.subscribe() → 출력: '그만 보기' 함수
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


/* =====================================================================
   여기서부터는 표에 담기는 진짜 댓글.
   위쪽(브라우저에 쌓는 것)과 이름이 겹치지 않게 낱말을 갈라 두었다 —
   위는 "say(말하다)", 아래는 "write·revise·drop(쓰다·고치다·지우다)".
   ===================================================================== */

/**
 * 표에 담긴 댓글 한 줄.
 *
 * 화면이 단추를 그릴지 말지 정하려면 "내가 쓴 것인가", "지울 수 있는가" 를
 * 알아야 한다. 그 판단을 화면이 이름 견주기로 하게 두면 안 된다 —
 * 닉네임이 같은 사람이 있으면 남의 댓글에 고치기 단추가 붙는다.
 * 그래서 **서버가 정해서 boolean 으로 내려 준다.**
 */
export type LiveComment = {
  id: string;
  /** 쓴 사람의 닉네임 */
  who: string;
  /** 그 사람의 프로필 사진 주소. 없으면 null 이고 화면이 첫 글자로 대신한다 */
  avatar: string | null;
  /** 언제 썼는지. 사람이 읽을 모양으로 이미 다듬어져 있다 */
  when: string;
  /** 내용 */
  text: string;
  /** 쓰고 나서 고친 적이 있는지. 있으면 화면에 "고침" 이라고 밝힌다 */
  edited: boolean;
  /** 내가 쓴 것인지. 고치기 단추를 붙일지 정한다 */
  mine: boolean;
  /** 지울 수 있는지. 쓴 사람과 그 글의 주인 둘 다 지울 수 있다 */
  canRemove: boolean;
};

/** 댓글을 표에 담아 주는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type CommentGateway = {
  /** 한 줄 남긴다 */
  add(postId: string, text: string): Promise<GatewayComment>;
  /** 내가 쓴 줄을 고친다 */
  edit(commentId: string, text: string): Promise<GatewayComment>;
  /** 지운다. 누가 지울 수 있는지는 표가 정한다 */
  remove(commentId: string): Promise<GatewayComment>;
};

/** 표가 돌려주는 대답 */
export type GatewayComment =
  | { ok: true }
  /** 로그인이 안 되어 있다 */
  | { ok: false; reason: "signed-out" }
  /** 표가 거절했다. 남의 댓글이거나 없는 글이다 */
  | { ok: false; reason: "rejected" }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 화면이 받아 보는 결과 */
export type TalkResult =
  | { ok: true }
  | {
      ok: false;
      reason: CommentProblem | Exclude<GatewayComment, { ok: true }>["reason"];
    };

/** 댓글 한 줄을 남긴다 */
// [F11][함수] writeComment(postId, raw, gateway): 표에 댓글 한 줄을 남긴다
// 입력: postId + raw + gateway(CommentGateway) → 처리: 도메인 검사 → 표에 insert
// 출력: TalkResult (비동기)
export async function writeComment(
  postId: string,
  raw: string,
  gateway: CommentGateway,
): Promise<TalkResult> {
  // 받아 줄 만한 글인지는 도메인이 본다. 서버에서도 한 번 더 보는 자리다
  // [F12][호출] raw → checkComment(domain/post) → read (화면에서 걸렀어도 서버에서 다시 본다)
  const read = checkComment(raw);

  // [F13][분기] read.ok → false: 까닭 반환 / true: F14
  if (!read.ok) return { ok: false, reason: read.problem };

  // [F14][외부] postId, read.text → gateway.add() ▷ supabase post_comments insert → saved
  // [F14][반환] 결과 → commentAction(app/actions/post.ts) → revalidatePath 로 목록 갱신
  const saved = await gateway.add(postId, read.text);

  return saved.ok ? { ok: true } : { ok: false, reason: saved.reason };
}

/** 내가 쓴 댓글을 고친다 */
// [F15][함수] reviseComment(commentId, raw, gateway): 내가 쓴 댓글을 고친다
// 입력: commentId + raw + gateway → 처리: 새로 쓸 때와 같은 검사 → 표 update → 출력: TalkResult
export async function reviseComment(
  commentId: string,
  raw: string,
  gateway: CommentGateway,
): Promise<TalkResult> {
  /* 고칠 때도 새로 쓸 때와 **같은 검사**를 한다. 두 벌로 두면 새로 쓸 수는 없는
     내용이 고치기로는 들어간다 */
  // [F16][호출] raw → checkComment() → read (새 댓글과 같은 규칙)
  const read = checkComment(raw);

  // [F17][분기] read.ok → false: 까닭 반환 / true: F18
  if (!read.ok) return { ok: false, reason: read.problem };

  // [F18][외부] commentId, read.text → gateway.edit() ▷ supabase post_comments update → saved
  const saved = await gateway.edit(commentId, read.text);

  return saved.ok ? { ok: true } : { ok: false, reason: saved.reason };
}

/** 댓글을 지운다. 내용이 없으니 도메인에 물을 것도 없다 */
// [F19][함수] dropComment(commentId, gateway): 댓글을 지운다
// 입력: commentId + gateway → 처리: 검사 없이 바로 표 delete → 출력: TalkResult
export async function dropComment(
  commentId: string,
  gateway: CommentGateway,
): Promise<TalkResult> {
  // [F20][외부] commentId → gateway.remove() ▷ supabase post_comments delete → done
  // [F20][반환] 결과 → removeCommentAction → revalidatePath 로 목록 갱신
  const done = await gateway.remove(commentId);

  return done.ok ? { ok: true } : { ok: false, reason: done.reason };
}

/** 표에 댓글이 하나도 없을 때 돌려주는 빈 목록. NO_COMMENTS 와 같은 까닭이다 */
export const NO_LIVE_COMMENTS: readonly LiveComment[] = Object.freeze([]);
