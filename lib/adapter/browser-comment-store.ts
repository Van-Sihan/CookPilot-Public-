/**
 * 어댑터 · 내가 쓴 댓글을 브라우저에 담아 두는 진짜 방법.
 *
 * 유스케이스가 적어 둔 CommentStore 약속을 localStorage 로 채워 준다.
 * 남에게도 보이게 하려면 이 파일만 수파베이스 것으로 갈아 끼우면 된다.
 */

import type { PostComment } from "@/lib/domain/post";
import { NO_COMMENTS, type CommentStore } from "@/lib/usecase/discuss-post";

/** 담아 둘 때 붙이는 이름표. 다른 값과 섞이지 않게 서비스 이름을 앞에 붙였다 */
const STORAGE_KEY = "cookpilot.comments";

/** "바뀌면 알려 줘" 하고 부탁한 쪽들의 명단. 같은 탭 안에서 생긴 변화를 전하는 길이다 */
const listeners = new Set<() => void>();

/** 글 id 마다 댓글 목록이 하나씩 달린 모양으로 담는다 */
type Bag = Record<string, PostComment[]>;

/**
 * 마지막으로 읽은 글자와, 그 글자를 풀어 만든 자루.
 *
 * 이 두 줄이 없으면 화면이 멈추지 않는다. React 는 load() 가 돌려준 값을
 * 지난번 값과 `===` 로 견주는데, 부를 때마다 JSON.parse 로 새 객체를 만들면
 * 내용이 같아도 늘 "다른 값" 이 되어 다시 그리기를 되풀이한다.
 */
let cachedRaw: string | null = null;
let cachedBag: Bag = {};

/** 명단에 있는 모두에게 한 번씩 알린다 */
// [F1][함수] notify(): 명단에 있는 모두에게 '바뀌었다' 고 알린다
function notify() {
  listeners.forEach((fn) => fn());
}

/** 값 하나가 댓글 모양인지 본다. 개발자 도구로 아무거나 넣어 뒀을 수 있다 */
// [F2][함수] readComment(value): 담겨 있던 값 하나가 댓글 모양인지 확인
// 입력: unknown → 처리: id·who·when·text 가 모두 글자인지 → 출력: PostComment 또는 null
function readComment(value: unknown): PostComment | null {
  // 객체가 아니면 볼 것도 없다. null 도 typeof 로는 "object" 라서 따로 거른다
  if (typeof value !== "object" || value === null) return null;

  // 칸을 꺼내 보려고 이름 있는 자루로 옮긴다
  const bag = value as Record<string, unknown>;

  // 네 칸이 모두 글자여야 화면에 그릴 수 있다
  const ok = ["id", "who", "when", "text"].every(
    (k) => typeof bag[k] === "string" && (bag[k] as string).length > 0,
  );

  return ok ? (value as PostComment) : null;
}

/** 담아 둔 글자를 자루로 푼다. 손상된 줄은 조용히 버린다 */
// [F3][함수] parse(raw): 담겨 있던 글자를 '글 id → 댓글 목록' 자루로 푼다
// 입력: raw → 처리: JSON.parse 후 줄마다 readComment(F2) → 출력: Bag
function parse(raw: string): Bag {
  try {
    const parsed: unknown = JSON.parse(raw);

    // 통째로 객체가 아니면 담아 둔 적 없는 것과 같이 본다
    if (typeof parsed !== "object" || parsed === null) return {};

    const out: Bag = {};

    // 글 id 마다 배열인지 보고, 그 안의 줄도 하나씩 살펴 넣는다
    for (const [postId, list] of Object.entries(parsed)) {
      if (!Array.isArray(list)) continue;

      // 모양이 맞는 줄만 남긴다. 한 줄이 깨졌다고 그 글의 댓글을 다 버릴 것은 없다
      const good = list.map(readComment).filter((c): c is PostComment => c !== null);

      // 다 버려져 빈 배열이 됐으면 칸 자체를 안 만든다
      if (good.length > 0) out[postId] = good;
    }

    return out;
  } catch {
    // JSON 이 아니면 담아 둔 적 없는 것과 같이 본다
    return {};
  }
}

/** 지금 담겨 있는 것을 자루로 꺼낸다. 글자가 그대로면 만들어 둔 자루를 그대로 쓴다 */
// [F4][함수] readBag(): 지금 담겨 있는 자루를 꺼낸다(캐시 포함)
// 입력: 없음 → 처리: localStorage 읽기 → 글자가 지난번과 다르면 parse(F3) → 출력: Bag
function readBag(): Bag {
  // 서버에서 화면을 그리는 동안에는 window 가 아예 없다
  if (typeof window === "undefined") return {};

  // [F5][외부] ▷ localStorage(cookpilot.comments) 읽기 → raw
  const raw = window.localStorage.getItem(STORAGE_KEY);

  // 글자가 지난번과 똑같으면 새로 풀지 않는다 — 위에 적어 둔 까닭이다
  // [F6][분기] 글자가 지난번과 다름 → true: 다시 parse 해서 캐시 갱신 / false: 캐시 그대로
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedBag = raw === null ? {} : parse(raw);
  }

  return cachedBag;
}

// [F7][함수] browserCommentStore: CommentStore 약속을 localStorage 로 채운다
export const browserCommentStore: CommentStore = {
  // [F8][함수] load(postId): 그 글에 쌓아 둔 댓글을 꺼낸다
  // 입력: postId → 처리: readBag(F4) 에서 그 칸만 → 출력: PostComment[]
  load(postId: string) {
    /* 없을 때 `[]` 를 그때그때 만들면 안 된다. 늘 같은 빈 목록을 돌려줘야
       React 가 "그대로다" 라고 알아본다 */
    return readBag()[postId] ?? NO_COMMENTS;
  },

  // [F9][함수] add(postId, comment): 댓글 한 줄을 쌓는다
  // 입력: postId + comment → 처리: 자루에 붙여 localStorage 기록 후 notify → 출력: 없음
  add(postId: string, comment: PostComment) {
    // 지금 담겨 있는 것을 먼저 읽는다. 다른 글의 댓글을 지우지 않으려는 것이다
    const bag = readBag();

    /* 새 자루를 만들어 담는다. 있던 자루를 고치면 캐시에 담긴 것과 같은 물건이라
       React 가 "바뀐 게 없다" 고 잘못 본다 */
    const next: Bag = { ...bag, [postId]: [...(bag[postId] ?? []), comment] };

    // 저장을 막아 둔 브라우저에서는 여기서 오류가 나고, 그건 유스케이스가 받아 준다
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    /* storage 신호는 다른 탭에만 간다. 지금 보고 있는 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  // [F10][함수] subscribe(onChange): 바뀌면 알려 달라고 명단에 올린다 → 출력: 해제 함수
  subscribe(onChange: () => void) {
    // 같은 탭에서 생긴 변화를 받을 수 있게 명단에 올린다
    listeners.add(onChange);

    /* 다른 탭에서 값을 바꾸면 이 신호로 온다 */
    window.addEventListener("storage", onChange);

    // 화면이 사라질 때 이 함수를 부르면 걸어 둔 것을 모두 거둔다
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("storage", onChange);
    };
  },
};
