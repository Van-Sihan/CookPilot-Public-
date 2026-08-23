/**
 * 도메인 · 내 요리 서재에 꽂히는 책 한 권과, 백업 파일의 생김새.
 *
 * 서재를 어디에 담아 두는지(브라우저냐 서버냐)는 여기서 모른다.
 * 다만 "백업 파일이라면 이렇게 생겨야 한다" 는 약속은 규칙이라 여기 있다.
 * 남이 준 파일을 그대로 믿고 집어넣으면 서재가 통째로 망가지기 때문이다.
 */

/** 서재에 꽂힌 레시피 한 권 */
export type ShelfBook = {
  /** 책을 구분하는 이름표. 같은 요리를 두 번 저장해도 서로 다른 값이 된다 */
  id: string;
  /** 책등에 적히는 요리 이름 */
  title: string;
  /** 언제 꽂았는지. 사람이 읽을 수 있게 ISO 글자로 담는다 */
  savedAt: string;
  /** 몇 인분으로 만들었는지. 표지에 함께 적힌다 */
  servings?: number;
  /** 표지 색조. 사진 없이 CSS 로 표지를 그리기 때문에 색만 담아 둔다 */
  cover?: string;
  /**
   * 레시피 전문.
   *
   * 제목만 담아 두면 서재에서 꺼내도 다시 AI 를 불러야 한다. 그러면 같은 요리인데
   * 다른 레시피가 나올 수 있고, 인터넷이 끊기면 아예 못 꺼낸다.
   * 그래서 통째로 담는다 — 서재의 값어치가 거기 있다.
   */
  recipe?: unknown;
};

/** 백업 파일 한 장. 판 번호를 같이 적어 둬야 나중에 형식을 바꿔도 옛 파일을 알아본다 */
export type ShelfBackup = {
  /** 이 형식의 판 번호 */
  version: 1;
  /** 꽂혀 있던 책 전부 */
  books: ShelfBook[];
};

/** 지금 쓰는 백업 형식의 판 번호 */
const BACKUP_VERSION = 1;

/** 백업 파일을 읽다가 걸렸을 때 알려 주는 쪽지. 무슨 말로 보여 줄지는 화면이 정한다 */
export type BackupProblem = "broken" | "shape" | "version";

/** 백업을 읽은 결과 */
export type BackupRead =
  | { ok: true; books: ShelfBook[] }
  | { ok: false; problem: BackupProblem };

/** 값 하나가 책 한 권 모양인지 본다. 한 권이라도 이상하면 파일 전체를 안 받는다 */
// [F1][함수] isBook(value): 값 하나가 책 한 권 모양인지 판정
// 입력: unknown → 처리: id·title·savedAt 이 모두 글자인지 확인 → 출력: boolean (F5 가 부른다)
function isBook(value: unknown): value is ShelfBook {
  // 객체가 아니면 볼 것도 없다. null 도 typeof 로는 "object" 라서 따로 걸러 낸다
  if (typeof value !== "object" || value === null) return false;

  // 아래에서 세 칸을 꺼내 보려고 이름 있는 자루로 한 번 옮긴다
  const book = value as Record<string, unknown>;

  /* 세 칸이 모두 글자여야 책으로 인정한다. 하나라도 비면 책등에 뭘 적을지 알 수 없다.
     나머지 칸(servings·cover·recipe)은 없어도 되고, 상해 있어도 책 한 권을
     통째로 버릴 만한 일은 아니라 여기서 따지지 않는다 —
     레시피를 꺼내 쓰는 쪽이 도메인의 readRecipe 로 다시 확인한다 */
  return (
    typeof book.id === "string" &&
    typeof book.title === "string" &&
    typeof book.savedAt === "string"
  );
}

/**
 * 서재를 백업 파일로 만든다.
 * 사람이 열어 볼 수도 있는 파일이라 줄바꿈을 넣어 읽기 좋게 적는다.
 */
// [F2][함수] writeBackup(books): 서재를 백업 파일 글자로 만든다
// 입력: books(ShelfBook[]) → 처리: 판 번호와 함께 JSON 문자열화 → 출력: 파일에 쓸 문자열
export function writeBackup(books: readonly ShelfBook[]): string {
  // 판 번호를 같이 적어야 나중에 형식이 바뀌어도 옛 파일을 구분할 수 있다
  // [F3][흐름] books → {version, books} → backup
  const backup: ShelfBackup = { version: BACKUP_VERSION, books: [...books] };

  // 두 칸 들여쓰기. 파일 크기보다 사람이 읽을 수 있는 쪽이 낫다
  // [F4][반환] JSON 문자열 → makeShelfBackup(keep-recipe-shelf) → pick-rail 이 파일로 내려받는다
  return JSON.stringify(backup, null, 2);
}

/**
 * 사람이 고른 파일을 서재에 넣어도 되는지 살펴본다.
 * 남이 준 파일이거나 손으로 고친 파일일 수 있으니 한 칸씩 다 확인한다.
 */
// [F5][함수] readBackup(text): 고른 파일 글자를 서재 목록으로 받아 줄지 판정
// 입력: text(파일에서 읽은 글자) → 처리: JSON 파싱 + 판 번호·모양 검사 → 출력: BackupRead
export function readBackup(text: string): BackupRead {
  // JSON 이 아닌 파일(사진이나 텍스트)을 고르면 여기서 바로 터진다
  let parsed: unknown;
  try {
    // [F6][흐름] text → JSON.parse() → parsed
    parsed = JSON.parse(text);
  } catch {
    // [F7][에러] JSON 이 아님 → 'broken' 반환 → 화면이 '파일이 깨졌다' 로 알린다
    return { ok: false, problem: "broken" };
  }

  // 배열이나 숫자를 넣었을 수도 있다. 객체가 아니면 백업이 아니다
  // [F8][분기] 객체가 아님 → true: 'shape' 반환 / false: F9
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, problem: "shape" };
  }

  // 안쪽 칸을 꺼내 보려고 이름 있는 자루로 옮긴다
  const backup = parsed as Record<string, unknown>;

  // 우리가 만든 파일이 아니거나 나중 판으로 만든 파일이면 잘못 읽을 수 있어 돌려보낸다
  // [F9][분기] 판 번호가 다름 → true: 'version' 반환 / false: F10
  if (backup.version !== BACKUP_VERSION) {
    return { ok: false, problem: "version" };
  }

  // 책 목록 자리가 배열이 아니면 더 볼 것이 없다
  // [F10][분기] books 가 배열이 아님 → true: 'shape' 반환 / false: F11
  if (!Array.isArray(backup.books)) {
    return { ok: false, problem: "shape" };
  }

  // 한 권이라도 모양이 틀리면 절반만 넣지 않고 통째로 돌려보낸다.
  // 반쯤 들어간 서재는 사람이 무엇이 빠졌는지 알 길이 없어서 더 나쁘다
  // [F11][반복] books 를 훑으며 isBook(F1) 호출 — 한 권이라도 틀리면 멈추고 'shape'
  if (!backup.books.every(isBook)) {
    return { ok: false, problem: "shape" };
  }

  // 여기까지 왔으면 전부 책 모양이다
  // [F12][반환] books → restoreShelfBackup(keep-recipe-shelf) → 저장소를 통째로 갈아 끼운다
  return { ok: true, books: backup.books };
}
