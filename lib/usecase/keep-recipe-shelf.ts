/**
 * 유스케이스 · "내 요리 서재 건사하기".
 *
 * 서재를 어디에 담아 두는지는 모른다. RecipeShelfStore 라는 약속으로 미뤄 둔다.
 * 백업 파일을 만들고 읽는 규칙은 도메인이 쥐고 있어서 여기서는 부르기만 한다.
 */

import {
  readBackup,
  writeBackup,
  type BackupProblem,
  type ShelfBook,
} from "@/lib/domain/recipe-shelf";

/**
 * 아직 한 권도 없는 서재.
 *
 * 부를 때마다 새 배열을 만들면 React 가 "서재가 바뀌었다" 고 오해한다.
 * 그래서 빈 서재도 늘 같은 배열 하나를 돌려 쓴다.
 */
export const EMPTY_SHELF: readonly ShelfBook[] = Object.freeze([]);

/** 서재를 담아 두는 곳이라면 이 네 가지는 할 줄 알아야 한다는 약속 */
export type RecipeShelfStore = {
  /** 꽂혀 있는 책을 전부 꺼낸다 */
  load(): readonly ShelfBook[];
  /** 서재를 통째로 갈아 끼운다. 백업을 되돌릴 때 쓴다 */
  replace(books: readonly ShelfBook[]): void;
  /** 서재를 비운다 */
  clear(): void;
  /** 서재가 바뀌면 알려 준다. 돌려주는 함수를 부르면 "이제 그만" 이 된다 */
  subscribe(onChange: () => void): () => void;
};

/** 지금 몇 권 꽂혀 있는지. 왼쪽 메뉴가 이 숫자만 보여 준다 */
// [F1][함수] countShelfBooks(store): 서재에 몇 권 있는지 센다
// 입력: store → 처리: store.load() ▷ localStorage 읽기 → 출력: 권수(숫자)
// [F1][반환] 숫자 → home-me · pick-rail 의 '○권 보기' 자리로
export function countShelfBooks(store: RecipeShelfStore): number {
  try {
    // 권수만 필요하지만 세는 일은 배열이 알아서 한다
    return store.load().length;
  } catch {
    // 못 읽는 상황은 "빈 서재" 와 똑같이 보여 준다. 숫자 자리에 오류를 띄울 일은 아니다
    return 0;
  }
}

/** 꽂혀 있는 책 전부. 지켜보기와 짝을 이뤄 화면이 바로 그릴 수 있게 한다 */
// [F2][함수] findShelfBooks(store): 꽂혀 있는 책 전부를 꺼낸다
// 입력: store → 처리: store.load() ▷ localStorage 읽기 → 출력: ShelfBook[]
// [F2][반환] 목록 → shelf-stand 가 가판대에 그리고, F6·F8·F10 이 다시 쓴다
export function findShelfBooks(store: RecipeShelfStore): readonly ShelfBook[] {
  try {
    // 꺼내 오는 방법은 어댑터가 안다
    return store.load();
  } catch {
    // 늘 같은 빈 배열 하나를 돌려준다
    return EMPTY_SHELF;
  }
}

/** 서재가 바뀌는지 지켜본다 */
// [F3][함수] watchShelf(store, onChange): 서재가 바뀌는지 지켜본다
// 입력: store + onChange → 처리: store.subscribe() → 출력: '그만 보기' 함수
export function watchShelf(store: RecipeShelfStore, onChange: () => void) {
  // "그만 보기" 함수를 그대로 올려 보낸다
  return store.subscribe(onChange);
}

/** 서재를 비운다. "전부 지우기" 가 이걸 부른다 */
// [F4][함수] emptyShelf(store): 서재를 통째로 비운다
// 입력: store → 처리: store.clear() ▷ localStorage 삭제 → 출력: 없음 (pick-rail 의 '전부 지우기')
export function emptyShelf(store: RecipeShelfStore): void {
  try {
    // 비우는 방법은 어댑터가 안다
    store.clear();
  } catch {
    // 못 비웠다고 알려 줘도 사람이 할 수 있는 일이 없다
  }
}

/**
 * 지금 서재를 백업 글자로 만든다.
 * 이 글자를 파일로 내려받는 일은 브라우저가 해야 해서 화면 쪽 몫으로 남긴다.
 */
// [F5][함수] makeShelfBackup(store): 서재를 백업 파일 글자로 만든다
// 입력: store → 처리: findShelfBooks(F2) → writeBackup(domain) → 출력: JSON 문자열
export function makeShelfBackup(store: RecipeShelfStore): string {
  // 형식을 정하는 것은 도메인이다. 여기서는 지금 책을 넘겨주기만 한다
  // [F6][호출] store → findShelfBooks(F2) → books → writeBackup(domain/recipe-shelf) → 문자열
  // [F6][반환] 문자열 → pick-rail 이 Blob 으로 감싸 파일로 내려받는다
  return writeBackup(findShelfBooks(store));
}

/**
 * 다 만든 요리를 서재에 꽂는다.
 *
 * 책 번호와 꽂은 시각을 밖에서 받는 까닭 —
 * 이 함수 안에서 `crypto.randomUUID()` 나 `new Date()` 를 부르면 같은 값을 넣어도
 * 매번 다른 결과가 나와서 시험할 수가 없다. 그런 값은 화면이 만들어 넘긴다.
 */
// [F7][함수] shelveRecipe(book, store): 만든 요리를 서재에 꽂는다
// 입력: book(ShelfBook, id·시각은 화면이 만들어 준다) + store → 처리: 같은 이름 덮어쓰기 → 저장
// 출력: {ok, count} 또는 {ok:false, reason:'storage'}
export function shelveRecipe(
  book: ShelfBook,
  store: RecipeShelfStore,
): { ok: true; count: number } | { ok: false; reason: "storage" } {
  // 지금 꽂혀 있는 책들
  // [F8][호출] store → findShelfBooks(F2) → books
  const books = findShelfBooks(store);

  /* 같은 요리를 또 저장하면 덮어쓴다. 새로 꽂으면 서재에 같은 이름이 쌓이는데,
     사람은 그중 어느 것이 최근 것인지 알 수 없다 */
  // [F9][반복] books 를 훑어 같은 제목을 뺀다 → kept (같은 요리를 두 번 저장하면 덮어쓴다)
  const kept = books.filter((b) => b.title !== book.title);

  try {
    // 새 책을 맨 앞에 둔다. 서재는 최근에 만든 것부터 보는 자리다
    // [F10][외부] [새 책, ...kept] → store.replace() ▷ localStorage 통째로 갈아 끼움
    store.replace([book, ...kept]);
  } catch {
    return { ok: false, reason: "storage" };
  }

  // [F11][반환] {ok:true, count} → done-shell 이 '서재에 꽂았다' 고 알린다
  return { ok: true, count: kept.length + 1 };
}

/**
 * 책 한 권을 서재에서 뺀다.
 *
 * 서재를 통째로 갈아 끼우는 방식이다. 저장소에 "한 권만 지우기" 를 따로 두지
 * 않은 까닭 — 그러면 저장소가 책이 무엇인지 알아야 하고, 지금처럼 글자 한 덩어리로
 * 담아 두는 방식에서는 어차피 전부 다시 써야 한다.
 */
// [F12][함수] unshelveBook(id, store): 책 한 권을 서재에서 뺀다
// 입력: id + store → 처리: 그 id 만 빼고 통째로 갈아 끼움 → 출력: {ok, count}
export function unshelveBook(
  id: string,
  store: RecipeShelfStore,
): { ok: true; count: number } | { ok: false; reason: "storage" } {
  // [F13][호출] store → findShelfBooks(F2) → books
  const books = findShelfBooks(store);

  // 지울 책만 뺀다. 없는 번호가 와도 그냥 그대로가 되므로 따로 막지 않는다
  // [F14][반복] books 를 훑어 지울 id 만 뺀다 → kept
  const kept = books.filter((b) => b.id !== id);

  try {
    // [F15][외부] kept → store.replace() ▷ localStorage 갈아 끼움 → shelf-stand 가 다시 그린다
    store.replace(kept);
  } catch {
    return { ok: false, reason: "storage" };
  }

  return { ok: true, count: kept.length };
}

/** 백업을 되돌린 결과. 잘못된 파일이면 까닭만 알려 주고 서재는 건드리지 않는다 */
export type RestoreResult =
  | { ok: true; count: number }
  | { ok: false; reason: BackupProblem | "storage" };

/**
 * 사람이 고른 백업 파일로 서재를 되돌린다.
 * 파일이 멀쩡한지 다 확인한 뒤에야 서재에 손을 댄다.
 * 먼저 비우고 나중에 넣으면, 파일이 잘못됐을 때 있던 서재까지 날아간다.
 */
// [F16][함수] restoreShelfBackup(text, store): 백업 파일로 서재를 되돌린다
// 입력: text(파일에서 읽은 글자) + store → 처리: readBackup 검사 → 통째로 갈아 끼움
// 출력: RestoreResult
export function restoreShelfBackup(
  text: string,
  store: RecipeShelfStore,
): RestoreResult {
  // 파일 검사는 통째로 도메인에 맡긴다
  // [F17][호출] text → readBackup(domain/recipe-shelf) → read
  const read = readBackup(text);

  // 검사에서 걸렸으면 서재는 그대로 두고 까닭만 올려 보낸다
  // [F18][분기] read.ok → false: 까닭 반환(서재는 그대로) / true: F19
  if (!read.ok) return { ok: false, reason: read.problem };

  try {
    // 한 번에 갈아 끼운다. 중간에 멈춰서 반만 남는 일이 없게 하려는 것이다
    store.replace(read.books);
  } catch {
    // 파일은 멀쩡했지만 담을 자리가 없었다. 모양이 틀린 것과는 다른 까닭으로 알린다
    return { ok: false, reason: "storage" };
  }

  // 몇 권이 들어왔는지 알려 준다. 화면은 이 숫자로 "n권을 되돌렸습니다" 를 만든다
  // [F19][반환] {ok:true, count} → pick-rail 이 '○권을 되돌렸다' 고 알린다
  return { ok: true, count: read.books.length };
}
