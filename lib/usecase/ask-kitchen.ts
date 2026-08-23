/**
 * 유스케이스 · "후기에 물어보기" (RAG).
 *
 * 하는 일은 셋이다.
 *
 *   1. 물음을 대화 기록에 담는다        (ChatLog)
 *   2. 후기를 찾아 그것만 근거로 답을 받는다 (RagChain)
 *   3. 답도 대화 기록에 담는다          (ChatLog)
 *
 * 2번 안쪽에서 "찾기 → 답하기" 가 다시 두 걸음으로 나뉘는데, 그 순서는
 * 랭체인이 쥔다(LCEL). 이 파일은 그 안을 들여다보지 않는다 —
 * 랭체인을 걷어 내고 직접 짜더라도 여기는 안 바뀐다.
 *
 * 담는 일이 먼저인 까닭: 답을 받다가 실패해도 사람이 무엇을 물었는지는
 * 남아야 한다. 새로 고쳤을 때 물음이 통째로 사라지면 다시 타이핑해야 한다.
 */

import {
  checkQuestion,
  recentTurns,
  type ChatTurn,
  type QuestionProblem,
  type SourceRef,
} from "@/lib/domain/ask";

/** 랭체인 파이프라인이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type RagChain = {
  /**
   * 물음과 지난 대화를 넘기면, 후기를 찾아 그것만 근거로 답을 만들어 온다.
   *
   * 찾기와 답하기를 따로 부르지 않는 까닭 — 랭체인의 LCEL 이 그 둘을
   * 한 줄기로 묶어 놓았다. 억지로 갈라 두면 랭체인을 쓰는 뜻이 없어진다.
   */
  run(question: string, history: readonly ChatTurn[]): Promise<ChainAnswer>;
};

/** 파이프라인이 돌려주는 대답 */
export type ChainAnswer =
  | { ok: true; text: string; sources: readonly SourceRef[] }
  /** 아직 아무것도 안 올려 뒀다. 사람이 "자료 올리기" 를 눌러야 풀린다 */
  | { ok: false; reason: "empty-index" }
  /** 물음에 걸리는 후기가 없다. 고장이 아니다 */
  | { ok: false; reason: "no-hits" }
  /** 키가 없거나 거절당했다 */
  | { ok: false; reason: "key" }
  /** 너무 자주 불렀다 */
  | { ok: false; reason: "too-many" }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/**
 * 대화를 담아 두는 곳이 지켜야 할 약속.
 *
 * 담기지 않아도 답은 나와야 한다. 그래서 아래 함수들은 실패를 알리지 않고
 * 조용히 넘어간다 — 수파베이스가 잠깐 안 되는 것과 챗봇이 고장 난 것은 다르다.
 */
export type ChatLog = {
  /** 대화 한 뭉치를 연다. 돌려주는 id 를 브라우저가 들고 다닌다 */
  open(title: string): Promise<string | null>;
  /** 말 한 마디를 담는다 */
  add(chatId: string, turn: ChatTurn): Promise<void>;
  /** 그 대화의 말을 시간순으로 꺼낸다 */
  read(chatId: string): Promise<readonly ChatTurn[]>;
};

/** 화면이 받아 보는 결과 */
export type AskResult =
  | { ok: true; turn: ChatTurn; chatId: string | null }
  | {
      ok: false;
      reason: QuestionProblem | Exclude<ChainAnswer, { ok: true }>["reason"];
    };

/** 대화 이름으로 쓸 만큼만 물음을 자른다 */
export const TITLE_LEN = 40;

/**
 * 물어본다.
 *
 * chatId 가 없으면 새 대화를 연다. 있으면 그 대화에 이어 붙인다.
 */
// [F1][함수] askKitchen(raw, history, chain, log, chatId): 챗봇에 묻고 답을 받는다
// 입력: raw(물음) + history(지난 대화) + chain(RagChain) + log(ChatLog) + chatId
// 처리: 도메인 검사 → 대화 열기/이어붙이기 → 물음 기록 → RAG 실행 → 답 기록
// 출력: AskResult (비동기)
export async function askKitchen(
  raw: string,
  history: readonly ChatTurn[],
  chain: RagChain,
  log: ChatLog,
  chatId: string | null,
): Promise<AskResult> {
  // 받아 줄 만한 물음인지는 도메인이 본다
  // [F2][호출] raw → checkQuestion(domain/ask) → read
  const read = checkQuestion(raw);

  // 안 되면 까닭만 그대로 올려 보낸다. 무슨 말로 보여 줄지는 화면이 고른다
  // [F3][분기] read.ok → false: 까닭 반환(모델을 안 부름) / true: F4
  if (!read.ok) return { ok: false, reason: read.problem };

  /* 대화가 없으면 연다. 이름은 첫 물음을 잘라 쓴다 —
     "새 대화" 만 늘어놓으면 나중에 목록에서 서로 구별이 안 된다 */
  // [F4][분기] chatId 있음 → 그대로 사용 / 없음 → F5
  // [F5][외부] 첫 물음 앞머리 → log.open() ▷ supabase chats insert → id
  const id = chatId ?? (await log.open(read.text.slice(0, TITLE_LEN)));

  // 물음을 먼저 담는다. 답을 못 받아도 물음은 남아야 한다
  // [F6][외부] {role:'user', content} → log.add() ▷ supabase messages insert (답보다 먼저 남긴다)
  if (id) await log.add(id, { role: "user", content: read.text });

  /* 지난 대화는 뒤쪽 몇 마디만. 방금 한 물음은 따로 넘기므로 여기 없다 —
     같이 넣으면 모델이 같은 물음을 두 번 받는다 */
  // [F7][호출] history → recentTurns(domain/ask) → 최근 6마디
  // [F7][외부] read.text + 최근 대화 → chain.run() ▷ 파인콘 검색 + 제미나이 생성 → answer
  const answer = await chain.run(read.text, recentTurns(history));

  // [F8][분기] answer.ok → false: 까닭 반환(물음은 이미 남아 있다) / true: F9
  if (!answer.ok) return { ok: false, reason: answer.reason };

  // [F9][흐름] answer.text + answer.sources → turn(ChatTurn)
  const turn: ChatTurn = {
    role: "assistant",
    content: answer.text,
    sources: answer.sources,
  };

  // 답도 담는다. 담기지 않아도 화면에는 보여 준다
  // [F10][외부] turn → log.add() ▷ supabase messages insert (실패해도 화면에는 보여 준다)
  if (id) await log.add(id, turn);

  // [F11][반환] {ok:true, turn, chatId} → app/api/chat/route.ts → ask-shell 화면으로 전달
  return { ok: true, turn, chatId: id };
}

/**
 * 지금 이어 붙이고 있는 대화 id 를 담아 두는 곳이 지켜야 할 약속.
 *
 * 로그인이 없어서 "내 대화" 를 가릴 방법이 이것뿐이다 — 브라우저가 id 를
 * 들고 있고, 그 id 를 아는 사람이 주인이다. 자세한 사정은 마이그레이션에 적었다.
 *
 * 인터페이스로 뒤집어 두는 까닭은 다른 저장소들과 같다. 나중에 로그인이 붙어
 * 계정에 따라다니게 만들려면 어댑터만 갈아 끼우면 된다.
 */
export type ChatIdStore = {
  /** 담아 둔 대화 id. 없으면 null */
  load(): string | null;
  /** 새 대화가 열리면 담는다 */
  save(id: string): void;
  /** 대화를 비울 때 버린다 */
  clear(): void;
  /** 바뀌면 알려 준다. 돌려주는 함수를 부르면 그만 본다 */
  subscribe(onChange: () => void): () => void;
};

/** 담아 둔 대화 id 를 꺼낸다 */
// [F12][함수] findChatId(store): 이어 붙일 대화 id 를 꺼낸다
// 입력: store → 처리: store.load() ▷ localStorage 읽기 → 출력: id 또는 null
export function findChatId(store: ChatIdStore): string | null {
  try {
    return store.load();
  } catch {
    // 못 읽는 상황은 "이어 붙일 대화가 없다" 와 똑같이 본다
    return null;
  }
}

/** 대화 id 를 담아 둔다 */
// [F13][함수] keepChatId(store, id): 새로 열린 대화 id 를 담아 둔다
// 입력: store + id → 처리: store.save() ▷ localStorage 기록 → 출력: 없음
export function keepChatId(store: ChatIdStore, id: string): void {
  try {
    store.save(id);
  } catch {
    // 담지 못해도 이번 대화는 그대로 이어진다. 새로 고치면 끊어질 뿐이다
  }
}

/** 담아 둔 대화 id 를 버린다 */
// [F14][함수] forgetChatId(store): 담아 둔 대화 id 를 버린다 (대화 비우기)
// 입력: store → 처리: store.clear() ▷ localStorage 삭제 → 출력: 없음
export function forgetChatId(store: ChatIdStore): void {
  try {
    store.clear();
  } catch {
    // 못 버렸다고 알려 줘도 사람이 할 수 있는 일이 없다
  }
}

/** 대화 id 가 바뀌는지 지켜본다 */
// [F15][함수] watchChatId(store, onChange): 대화 id 가 바뀌는지 지켜본다
// 입력: store + onChange → 처리: store.subscribe() → 출력: '그만 보기' 함수
export function watchChatId(store: ChatIdStore, onChange: () => void) {
  return store.subscribe(onChange);
}
