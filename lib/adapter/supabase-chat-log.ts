import "server-only";

/**
 * 어댑터 · 대화를 수파베이스에 담아 두는 진짜 방법.
 *
 * 유스케이스가 적어 둔 ChatLog 약속을 채워 준다.
 *
 * **담기지 않아도 답은 나와야 한다.** 그래서 여기서 나는 오류는 위로
 * 던지지 않고 조용히 삼킨다 — 수파베이스가 잠깐 안 되는 것과
 * 챗봇이 고장 난 것은 다르다. 사람에게는 후자만 보여야 한다.
 *
 * 읽을 때 표를 직접 뒤지지 않고 `chat_messages(uuid)` 함수를 부르는 것이 요점이다.
 * 그 표에는 select 정책이 없어서 직접 뒤지면 한 줄도 안 나온다 —
 * 대화 id 를 아는 사람만 읽으라는 뜻이고, 마이그레이션에 그렇게 적어 두었다.
 */

import type { ChatTurn, SourceRef } from "@/lib/domain/ask";
import { createSupabaseServerClient } from "@/lib/adapter/supabase-server-client";
import type { ChatLog } from "@/lib/usecase/ask-kitchen";

/** 함수가 돌려주는 한 줄 */
type Row = {
  role?: unknown;
  content?: unknown;
  sources?: unknown;
};

/** 한 줄을 대화 한 마디로 받아 준다. 모양이 어긋나면 null */
function readTurn(row: Row): ChatTurn | null {
  const role = row.role === "user" || row.role === "assistant" ? row.role : null;
  const content = typeof row.content === "string" ? row.content : "";

  // 역할이나 내용이 없으면 화면에 그릴 수 없다
  if (!role || content.length === 0) return null;

  return {
    role,
    content,
    // jsonb 로 담은 값이라 배열인지 한 번 보고 넘긴다
    sources: Array.isArray(row.sources) ? (row.sources as SourceRef[]) : [],
  };
}

export const supabaseChatLog: ChatLog = {
  async open(title: string) {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from("chats")
        // 이름만 넣는다. id 와 시각은 데이터베이스가 만든다
        .insert({ title })
        // 새로 생긴 id 를 받아 와야 다음 말들을 여기에 붙일 수 있다
        .select("id")
        .single();

      // 표가 아직 없거나(마이그레이션 전) 막혔으면 대화 없이 그냥 간다
      if (error || !data) return null;

      return data.id as string;
    } catch {
      return null;
    }
  },

  async add(chatId: string, turn: ChatTurn) {
    try {
      const supabase = await createSupabaseServerClient();

      await supabase.from("messages").insert({
        chat_id: chatId,
        role: turn.role,
        content: turn.content,
        // 근거가 없는 말(사람이 한 말)도 빈 배열로 넣는다. null 과 섞이면 읽는 쪽이 번거롭다
        sources: turn.sources ?? [],
      });
    } catch {
      /* 담지 못했어도 답은 이미 만들어졌다. 여기서 막으면 사람이 답을 못 본다 —
         새로 고쳤을 때 이 한 마디가 없다는 것만 감수한다 */
    }
  },

  async read(chatId: string) {
    try {
      const supabase = await createSupabaseServerClient();

      /* 표를 직접 select 하지 않는다. select 정책이 없어서 빈 목록만 온다.
         대화 id 를 넘겨야만 그 대화를 돌려주는 함수를 부른다 */
      const { data, error } = await supabase.rpc("chat_messages", { chat: chatId });

      if (error || !Array.isArray(data)) return [];

      // 모양이 어긋난 줄은 버린다. 한 줄 때문에 대화 전체가 안 뜨면 안 된다
      return data.map(readTurn).filter((t): t is ChatTurn => t !== null);
    } catch {
      return [];
    }
  },
};
