import { NextResponse } from "next/server";
import { supabaseChatLog } from "@/lib/adapter/supabase-chat-log";

/**
 * GET /api/chat/[id] — 담아 둔 대화를 꺼내 온다.
 *
 * 새로 고쳐도 주고받은 말이 남아 있게 하려고 둔다. 브라우저는 대화 id 만
 * 들고 있고, 말은 수파베이스에서 가져온다.
 *
 * 읽는 일은 `chat_messages(uuid)` 함수를 거친다. `messages` 표에는
 * select 정책이 없어서 목록을 훑을 수 없고, **대화 id 를 아는 사람만**
 * 그 대화를 읽는다. 자세한 사정은 마이그레이션 파일에 적어 두었다.
 */
// [F1][함수] GET(_request, props): 담아 둔 대화를 꺼내 온다 (/api/chat/[id])
// 입력: 주소의 [id] → 처리: chat_messages 함수로 읽기 → 출력: {turns}(JSON)
export async function GET(_request: Request, props: RouteContext<"/api/chat/[id]">) {
  /* Next.js 16 에서 params 는 기다려야 하는 값이다.
     주소는 요청이 와야 알 수 있는 것이라 미리 만들어 둘 수 없기 때문이다 */
  // [F2][흐름] props.params(기다려야 하는 값) → id
  const { id } = await props.params;

  /* 없는 대화든 남의 대화든 빈 목록이 온다. 404 와 200 을 갈라 두지 않는 까닭 —
     갈라 두면 "이 id 는 있다" 는 사실이 새어 나가 대화를 헤아려 볼 수 있게 된다 */
  // [F3][외부] id ▷ supabaseChatLog.read() → rpc('chat_messages') → turns
  // [F3][반환] {turns} → ask-shell 이 새로 고쳐도 지난 말을 되살린다
  // 없는 대화든 남의 대화든 빈 목록이 온다(404 와 갈라 두면 id 존재가 새어 나간다)
  return NextResponse.json({ turns: await supabaseChatLog.read(id) });
}
