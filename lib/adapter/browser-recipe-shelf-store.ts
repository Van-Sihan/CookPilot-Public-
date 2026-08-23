/**
 * 어댑터 · 내 요리 서재를 브라우저에 담아 두는 진짜 방법.
 *
 * 유스케이스가 적어 둔 RecipeShelfStore 약속을 localStorage 로 채워 준다.
 * 서재가 계정에 따라다니게 되는 날에는 이 파일만 갈아 끼운다.
 */

import type { ShelfBook } from "@/lib/domain/recipe-shelf";
import { EMPTY_SHELF, type RecipeShelfStore } from "@/lib/usecase/keep-recipe-shelf";

/** 담아 둘 때 붙이는 이름표 */
const STORAGE_KEY = "cookpilot.recipe-shelf";

/** "바뀌면 알려 줘" 하고 부탁한 쪽들의 명단 */
const listeners = new Set<() => void>();

/**
 * 마지막으로 읽은 글자와, 그 글자를 풀어 만든 배열.
 * 고른 값 저장소와 같은 까닭이다 — 부를 때마다 새 배열을 만들면
 * React 가 "서재가 바뀌었다" 고 오해해 다시 그리기를 끝없이 되풀이한다.
 */
let cachedRaw: string | null = null;
let cachedBooks: readonly ShelfBook[] = EMPTY_SHELF;

/** 명단에 있는 모두에게 한 번씩 알린다 */
// [F1][함수] notify(): 명단에 있는 모두에게 '바뀌었다' 고 알린다
function notify() {
  // 알리는 도중에 누가 명단에서 빠질 수도 있지만 Set 은 그 정도는 견딘다
  listeners.forEach((fn) => fn());
}

/** 담아 둔 글자를 책 목록으로 푼다. 손상됐으면 빈 서재로 본다 */
// [F2][함수] parse(raw): 담겨 있던 글자를 책 목록으로 푼다
// 입력: raw → 처리: JSON.parse 후 배열인지 확인 → 출력: ShelfBook[]
function parse(raw: string): readonly ShelfBook[] {
  try {
    // 사람이 개발자 도구로 아무 글자나 넣어 뒀을 수도 있다
    const parsed: unknown = JSON.parse(raw);

    // 배열이 아니면 서재로 볼 수 없다. 여기 담기는 것은 우리가 넣은 값이라 칸까지는 안 뒤진다
    return Array.isArray(parsed) ? (parsed as ShelfBook[]) : EMPTY_SHELF;
  } catch {
    // JSON 이 아니면 담아 둔 적 없는 것과 같이 본다
    return EMPTY_SHELF;
  }
}

// [F3][함수] browserRecipeShelfStore: RecipeShelfStore 약속을 localStorage 로 채운다
export const browserRecipeShelfStore: RecipeShelfStore = {
  // [F4][함수] load(): 꽂혀 있는 책 전부를 꺼낸다
  // 입력: 없음 → 처리: localStorage 읽기 → parse(F2) → 출력: ShelfBook[]
  load() {
    // 서버에서 화면을 그리는 동안에는 window 가 아예 없다
    if (typeof window === "undefined") return EMPTY_SHELF;

    // 이름표로 찾아 꺼낸다
    const raw = window.localStorage.getItem(STORAGE_KEY);

    // 글자가 지난번과 똑같으면 만들어 둔 배열을 그대로 돌려준다
    if (raw !== cachedRaw) {
      // 새 글자를 기억해 두고
      cachedRaw = raw;
      // 그 글자로 만든 배열도 함께 기억해 둔다
      cachedBooks = raw === null ? EMPTY_SHELF : parse(raw);
    }

    // 기억해 둔 배열을 그대로 넘긴다
    return cachedBooks;
  },

  // [F5][함수] replace(books): 서재를 통째로 갈아 끼운다
  // 입력: books → 처리: JSON 으로 localStorage 기록 후 notify → 출력: 없음
  replace(books: readonly ShelfBook[]) {
    // 저장을 막아 둔 브라우저에서는 여기서 오류가 나고, 그건 유스케이스가 받아 준다
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(books));

    /* 지금 보고 있는 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  // [F6][함수] clear(): 서재를 비운다
  clear() {
    // 빈 배열로 덮지 않고 아예 지운다. 나중에 "한 번도 안 썼다" 와 구분할 여지를 남겨 둔다
    window.localStorage.removeItem(STORAGE_KEY);

    /* 지금 보고 있는 탭에는 직접 알려 줘야 한다 */
    notify();
  },

  // [F7][함수] subscribe(onChange): 바뀌면 알려 달라고 명단에 올린다 → 출력: 해제 함수
  subscribe(onChange: () => void) {
    // 같은 탭에서 생긴 변화를 받을 수 있게 명단에 올린다
    listeners.add(onChange);

    /* 다른 탭에서 서재를 고치면 이 신호로 온다 */
    window.addEventListener("storage", onChange);

    // 화면이 사라질 때 이 함수를 부르면 걸어 둔 것을 모두 거둔다
    return () => {
      // 명단에서 빼서 같은 탭 알림을 끊고
      listeners.delete(onChange);

      // 다른 탭 알림도 함께 거둔다
      window.removeEventListener("storage", onChange);
    };
  },
};
