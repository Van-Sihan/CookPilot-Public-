/**
 * 도메인 · 챗봇에게 묻고 답을 받는 일의 규칙.
 *
 * 무엇을 물어도 되는지, 대화 한 마디가 어떻게 생겼는지, 지난 대화를 얼마나
 * 딸려 보낼지 — 여기까지가 이 파일이 아는 전부다.
 *
 * 랭체인도 파인콘도 제미나이도 모른다. 그것들은 [[langchain-rag]] 가 안다.
 */

/** 물어볼 수 있는 가장 짧은 길이. 한 글자는 손이 미끄러진 쪽에 가깝다 */
export const MIN_QUESTION = 2;

/**
 * 가장 긴 길이.
 *
 * 위를 막는 까닭은 돈이다. 물음은 그대로 임베딩 모델과 제미나이에 실려 가고
 * 글자 수만큼 값이 매겨진다. 소설 한 편을 붙여넣어 보내게 두면 안 된다.
 */
export const MAX_QUESTION = 500;

/** 물음을 못 받아 준 까닭. 무슨 말로 보여 줄지는 화면이 정한다 */
export type QuestionProblem = "empty" | "short" | "long";

/** 물음을 살펴본 결과 */
export type QuestionRead =
  | { ok: true; text: string }
  | { ok: false; problem: QuestionProblem };

/** 물음을 받아 줄지 살펴본다 */
// [F1][함수] checkQuestion(raw): 챗봇에 보낼 물음을 받아 줄지 판정
// 입력: raw(/ask 입력칸 글자) → 처리: trim 후 길이 검사 → 출력: QuestionRead
export function checkQuestion(raw: string): QuestionRead {
  // 앞뒤 여백을 걷어 내고 길이를 잰다. 공백만 잔뜩인 물음을 막는다
  // [F2][흐름] raw → trim() → text
  const text = raw.trim();

  // [F3][분기] 길이 0 → 'empty' / 2 미만 → 'short' / 500 초과 → 'long' / 아니면 F4
  if (text.length === 0) return { ok: false, problem: "empty" };
  if (text.length < MIN_QUESTION) return { ok: false, problem: "short" };
  if (text.length > MAX_QUESTION) return { ok: false, problem: "long" };

  // [F4][반환] text → {ok:true, text} → askKitchen(ask-kitchen) 으로 전달
  return { ok: true, text };
}

/** 답의 근거가 된 후기 하나 */
export type SourceRef = {
  /** 어느 요리 글의 후기인지. 눌러서 그 글로 갈 수 있어야 근거가 뜻을 가진다 */
  dishId: string;
  /** 요리 이름 */
  dish: string;
  /** 그 후기를 쓴 사람 */
  author: string;
  /** 별점 */
  rating: number;
};

/** 주고받은 말 한 마디 */
export type ChatTurn = {
  /**
   * 누가 한 말인지.
   *
   * "me"/"bot" 이 아니라 "user"/"assistant" 로 두었다. 랭체인과 수파베이스
   * `messages` 표가 쓰는 낱말이라, 여기서 다르게 부르면 세 군데를 오갈 때마다
   * 옮겨 적는 코드가 생긴다.
   */
  role: "user" | "assistant";
  /** 무슨 말을 했는지 */
  content: string;
  /** 챗봇 말에만 붙는 근거 */
  sources?: readonly SourceRef[];
};

/**
 * 지난 대화를 몇 마디까지 딸려 보낼 것인가.
 *
 * LLM 에 보내는 요청은 무상태다. 앞의 요청을 기억하지 못한다. 그래서 대화가
 * 이어지는 것처럼 보이려면 **지난 말을 매번 다시 실어 보내야** 한다.
 *
 * 그러면 대화가 길어질수록 요청이 무거워지고, 언젠가는 넣을 수 있는 글자 수를
 * 넘긴다. 뒤쪽 몇 마디만 보내면 "그거 몇 분이라고 했지?" 같은 이어지는 물음은
 * 그대로 통하면서 값은 일정하게 붙잡힌다.
 */
export const KEEP_TURNS = 6;

/** 지난 대화 중 뒤쪽 몇 마디만 남긴다 */
// [F5][함수] recentTurns(history): 지난 대화 중 뒤쪽 몇 마디만 남긴다
// 입력: history(ChatTurn[]) → 처리: slice(-KEEP_TURNS) → 출력: 최근 6마디
export function recentTurns(history: readonly ChatTurn[]): readonly ChatTurn[] {
  // slice 는 음수를 받으면 뒤에서부터 센다. 짧으면 있는 만큼만 나온다
  // [F6][반환] 뒤에서 6마디 → langchain-rag 의 프롬프트로 실려 나간다
  return history.slice(-KEEP_TURNS);
}

/**
 * 한 번에 몇 건을 근거로 삼을 것인가.
 *
 * 많이 줄수록 답이 좋아질 것 같지만 그렇지 않다. 상관없는 후기가 섞이면
 * 모델이 거기에 끌려간다. 교재도 다섯으로 잡는다.
 */
export const TAKE = 5;

/**
 * 같은 요리의 후기가 여럿 걸렸을 때 출처를 하나로 접는다.
 *
 * 다섯 건이 모두 계란찜 후기일 수 있다. 그때 출처를 다섯 줄 늘어놓으면
 * 근거가 많아 보이지만 실은 글 하나다.
 */
// [F7][함수] foldSources(refs): 같은 요리의 출처를 하나로 접는다
// 입력: refs(검색으로 걸린 근거들) → 처리: dishId 로 중복 제거 → 출력: 접힌 SourceRef[]
export function foldSources(refs: readonly SourceRef[]): readonly SourceRef[] {
  // [F8][흐름] 빈 seen(Set) 과 out(배열) 생성 — 아래 반복이 여기에 쌓는다
  const seen = new Set<string>();
  const out: SourceRef[] = [];

  // [F9][반복] refs 를 처음부터 끝까지 훑는다
  for (const r of refs) {
    // 요리 이름이 없는 것은 근거로 쓸 수 없다
    // [F10][분기] 요리 이름 없음 또는 이미 본 요리 → true: 건너뜀 / false: F11
    if (!r.dish || seen.has(r.dishId || r.dish)) continue;

    // [F11][흐름] r → seen 에 표시 → out 에 push
    seen.add(r.dishId || r.dish);
    out.push(r);
  }

  // [F12][반환] out → askKitchen → /ask 화면의 근거 목록으로 전달
  return out;
}
