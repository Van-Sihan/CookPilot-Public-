import { NextResponse } from "next/server";
import { langchainRag } from "@/lib/adapter/langchain-rag";
import { supabaseChatLog } from "@/lib/adapter/supabase-chat-log";
import { checkApiKey } from "@/lib/domain/api-key";
import type { ChatTurn } from "@/lib/domain/ask";
import { askKitchen, type AskResult } from "@/lib/usecase/ask-kitchen";

/**
 * POST /api/chat — 물음 하나에 답 하나.
 *
 * 이 자리가 있는 까닭은 파인콘 키다. 그 키는 우리 계정 것이라 브라우저에
 * 내보낼 수 없다.
 *
 * **제미나이 키는 반대 방향으로 온다.** 사람이 시작 화면에서 넣어 둔 자기 키를
 * 브라우저가 요청마다 실어 보낸다. 랭체인 체인이 서버에서 한 줄기로 돌아야 해서
 * 이렇게 했다 — 받은 키는 그 요청 안에서만 쓰고 담아 두지도, 적어 두지도 않는다.
 *
 * 실패해도 200 으로 돌려준다. 까닭을 몸통에 담아야 화면이
 * "아직 자료를 안 올렸다" 와 "키가 틀렸다" 를 갈라 말할 수 있다.
 * 500 만 던지면 사람은 무엇을 고쳐야 할지 알 수 없다.
 *
 * 순서를 정하는 일은 통째로 유스케이스가 맡는다. 이 파일은 몸통을 풀어
 * 넘기고 결과를 그대로 내보내는 것 말고는 하는 일이 없다.
 */

/** 지난 대화로 받아 줄 수 있는 마디 수. 위를 막지 않으면 몸통이 얼마든지 커진다 */
const MAX_HISTORY = 40;

/** 몸통에서 지난 대화를 읽는다. 모양이 어긋난 마디는 버린다 */
// [F1][함수] readHistory(value): 몸통에 실려 온 지난 대화를 받아 준다
// 입력: value(브라우저가 보낸 배열) → 처리: 뒤 40마디만 → 줄마다 role·content 검사
// 출력: ChatTurn[] (모양이 어긋난 마디는 버린다)
function readHistory(value: unknown): readonly ChatTurn[] {
  // [F2][분기] 배열이 아님 → true: 빈 배열 반환 / false: F3
  if (!Array.isArray(value)) return [];

  // [F3][반복] slice(-40) 한 뒤 줄마다 role·content 를 확인하고 이상한 줄은 걸러 낸다
  // [F3][반환] ChatTurn[] → F9 가 askKitchen 에 넘긴다
  return value
    .slice(-MAX_HISTORY)
    .map((raw): ChatTurn | null => {
      const bag = raw as { role?: unknown; content?: unknown };
      const role = bag.role === "user" || bag.role === "assistant" ? bag.role : null;
      const content = typeof bag.content === "string" ? bag.content : "";

      // 브라우저가 보낸 값이라 그대로 믿지 않는다. 그대로 모델에 실려 가는 글자다
      return role && content ? { role, content } : null;
    })
    .filter((t): t is ChatTurn => t !== null);
}

// [F4][함수] POST(request): 물음 하나에 답 하나 (/api/chat)
// 입력: request 몸통(question, history, chatId, apiKey)
// 처리: 몸통 풀기 → 키 모양 검사 → askKitchen 호출 → 출력: AskResult(JSON)
// 실패도 200 으로 돌려준다 — 화면이 까닭을 갈라 말할 수 있어야 하기 때문
export async function POST(request: Request) {
  let body: unknown;

  try {
    // [F5][외부] ▷ request.json() — 브라우저가 보낸 몸통을 읽는다 → body
    body = await request.json();
  } catch {
    // 몸통이 JSON 이 아니면 우리 화면이 부른 게 아니다
    // [F6][에러] 몸통이 JSON 이 아님 → 400 + {ok:false, reason:'unreachable'}
    return NextResponse.json(
      { ok: false, reason: "unreachable" } satisfies AskResult,
      { status: 400 },
    );
  }

  const bag = body as {
    question?: unknown;
    history?: unknown;
    chatId?: unknown;
    apiKey?: unknown;
  };

  // [F7][흐름] body → bag → question (글자가 아니면 빈 글자)
  const question = typeof bag.question === "string" ? bag.question : "";

  /* 브라우저가 실어 보낸 제미나이 키. 모양만 도메인에 물어본다 —
     맞는 키인지는 실제로 써 봐야 알고, 그건 아래에서 구글이 알려 준다 */
  // [F8][호출] bag.apiKey → checkApiKey(domain/api-key) → read (모양만 본다)
  const read = checkApiKey(typeof bag.apiKey === "string" ? bag.apiKey : "");

  // 키가 없으면 다녀올 곳이 없다. 화면이 "키 넣으러 가기" 를 띄운다
  // [F9][분기] 키가 없음 → true: {ok:false, reason:'key'} 반환(다녀오지 않음) / false: F10
  if (!read.ok) {
    return NextResponse.json({ ok: false, reason: "key" } satisfies AskResult);
  }

  // 이어 붙일 대화가 있으면 그 id, 없으면 유스케이스가 새로 연다
  // [F10][흐름] bag.chatId → chatId (없으면 null → 유스케이스가 새 대화를 연다)
  const chatId = typeof bag.chatId === "string" && bag.chatId ? bag.chatId : null;

  // [F11][호출] question + readHistory(F1) + langchainRag(read.key) + supabaseChatLog + chatId
  // → askKitchen(usecase/ask-kitchen) → result
  const result = await askKitchen(
    question,
    readHistory(bag.history),
    langchainRag(read.key),
    supabaseChatLog,
    chatId,
  );

  // [F12][반환] result(JSON) → ask-shell 화면이 답과 근거를 그린다
  return NextResponse.json(result);
}
