"use client";

/**
 * 물어보기 화면의 껍데기.
 *
 * 브라우저가 하는 일은 하나뿐이다 — `/api/chat` 에 물음을 보내고 답을 받는다.
 * 찾기와 답 만들기는 전부 서버의 랭체인 파이프라인이 한다([[langchain-rag]]).
 *
 * 파인콘 키도 제미나이 키도 서버에 있어서 여기로 나오지 않는다.
 * 그래서 이 파일에는 모델 이름도 인덱스 이름도 안 나온다.
 *
 * 대화 id 만 브라우저가 들고 다닌다. 로그인이 없어서 "내 대화" 를 가릴 방법이
 * 그것뿐이다 — 자세한 사정은 마이그레이션 파일에 적어 두었다.
 *
 * 후기를 파인콘에 올리는 일은 이 화면에 없다. 자료를 심는 일은 개발자가
 * 한 번 하는 것이지 물어보러 온 사람이 볼 단추가 아니다.
 * 올릴 일이 생기면 `POST /api/kitchen/index` 를 부른다.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserChatIdStore } from "@/lib/adapter/browser-chat-id-store";
import { MAX_QUESTION, type ChatTurn } from "@/lib/domain/ask";
import {
  findChatId,
  forgetChatId,
  keepChatId,
  watchChatId,
  type AskResult,
} from "@/lib/usecase/ask-kitchen";
import { findSavedKey, watchSavedKey } from "@/lib/usecase/enter-with-api-key";
import { askCopy, askMessages, askNeedsKey, askNoHits } from "@/lib/ask-content";

export function AskShell() {
  /* 시작 화면에서 넣어 둔 제미나이 키. 없으면 답을 만들 수 없다 */
  const watchKey = useCallback(
    (fn: () => void) => watchSavedKey(browserApiKeyStore, fn),
    [],
  );
  const apiKey = useSyncExternalStore(
    watchKey,
    () => findSavedKey(browserApiKeyStore),
    // 서버에는 저장 공간이 없으니 늘 "없음" 으로 본다
    () => null,
  );

  /* 주고받은 말 */
  const [turns, setTurns] = useState<readonly ChatTurn[]>([]);

  /* 지금 이어 붙이고 있는 대화. 브라우저에 담겨 있어서 "바깥 값 지켜보기" 로 따라간다.
     useState 로 두고 효과 안에서 채우면 "그리는 도중에 setState 하지 말라" 는
     규칙에 걸린다. 저장소에서 곧바로 읽으면 그 단계 자체가 없어진다 */
  const watchId = useCallback(
    (fn: () => void) => watchChatId(browserChatIdStore, fn),
    [],
  );
  const chatId = useSyncExternalStore(
    watchId,
    () => findChatId(browserChatIdStore),
    // 서버에는 저장 공간이 없으니 늘 "없음" 으로 본다
    () => null,
  );

  /* 입력칸에 지금 적혀 있는 글자 */
  const [draft, setDraft] = useState("");

  /* 답을 기다리는 중인지. 기다리는 동안 또 보내면 두 번 물어보게 된다 */
  const [asking, setAsking] = useState(false);

  /* 돌려보냈을 때 밑에 뜨는 말 */
  const [problem, setProblem] = useState<string | null>(null);

  /* 말이 늘어나면 맨 아래로 따라 내려가게 하려고 바닥에 표시를 하나 둔다 */
  const bottom = useRef<HTMLDivElement>(null);

  /* 담아 둔 대화에 무슨 말이 오갔는지 서버에 물어본다.
     화면을 처음 열 때 한 번만 한다 — 그래서 chatId 가 아니라 loaded 를 본다.
     chatId 를 지켜보게 두면 새 대화가 열릴 때마다 방금 그린 말을 다시 받아 온다 */
  const loaded = useRef(false);

  useEffect(() => {
    // 담아 둔 대화가 없거나 이미 한 번 꺼내 왔으면 할 일이 없다
    if (!chatId || loaded.current) return;

    // 여기서 표시를 남기는 것은 그리는 중이 아니라 다 그린 뒤라 괜찮다
    loaded.current = true;

    fetch(`/api/chat/${chatId}`)
      .then((r) => r.json())
      .then((body: { turns?: ChatTurn[] }) => {
        // 담긴 말이 있을 때만 덮어쓴다. 빈 목록으로 덮으면 방금 한 말이 사라진다
        if (Array.isArray(body.turns) && body.turns.length > 0) setTurns(body.turns);
      })
      .catch(() => {
        // 못 꺼내 왔으면 빈 대화로 시작한다. 고장으로 보일 일은 아니다
      });
  }, [chatId]);

  /* 새 말이 붙을 때마다 바닥으로 내린다 */
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, asking]);

  /** 물어본다 */
  async function ask(raw: string) {
    // 기다리는 중에 또 누르면 무시한다. 두 번 물으면 값도 두 번 나간다
    if (asking) return;

    const text = raw.trim();
    if (text.length === 0) return;

    // 키가 없으면 다녀올 곳이 없다. 화면 위쪽에 이미 안내가 떠 있다
    if (!apiKey) return;

    /* 내가 한 말을 먼저 붙인다. 답을 기다리는 동안 내 말이 안 보이면
       눌린 건지 아닌지 알 수 없다 */
    const before = turns;

    setDraft("");
    setProblem(null);
    setAsking(true);
    setTurns([...before, { role: "user", content: text }]);

    let result: AskResult;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        /* 지난 대화를 같이 보낸다. LLM 요청은 무상태라, 안 보내면
           "그거 몇 분이라고 했지?" 가 안 통한다 */
        /* 키를 함께 보낸다. 우리 서버를 한 번 거치지만 그 요청 안에서만 쓰이고
           어디에도 담기지 않는다 — 화면 아래에 그렇게 적어 두었다 */
        body: JSON.stringify({ question: text, history: before, chatId, apiKey }),
      });

      result = (await res.json()) as AskResult;
    } catch {
      result = { ok: false, reason: "unreachable" };
    }

    setAsking(false);

    if (result.ok) {
      setTurns((now) => [...now, result.turn]);

      /* 새 대화가 열렸으면 id 를 담아 둔다. 새로 고쳐도 이어진다.
         담는 순간 위의 useSyncExternalStore 가 알아채고 chatId 가 바뀐다 */
      if (result.chatId && result.chatId !== chatId) {
        // 이미 화면에 그려 둔 말을 다시 받아 오지 않도록 표시를 미리 남긴다
        loaded.current = true;
        keepChatId(browserChatIdStore, result.chatId);
      }

      return;
    }

    /* 걸리는 후기가 없는 것은 고장이 아니다. 챗봇이 "못 찾았다" 고 말하는 것이
       맞지, 빨간 오류 줄로 보여 줄 일이 아니다 */
    if (result.reason === "no-hits") {
      setTurns((now) => [...now, { role: "assistant", content: askNoHits }]);
      return;
    }

    // 나머지는 사람이 뭔가 해야 풀리는 것들이다. 무엇을 하라고 적어 준다
    setProblem(askMessages[result.reason]);

    // 답을 못 받았으니 방금 붙인 내 말도 거둔다. 남겨 두면 못 받은 채로 걸려 있다
    setTurns(before);
    setDraft(text);
  }

  /** 대화를 비운다. 담아 둔 id 까지 버려야 새 대화가 열린다 */
  function onClear() {
    setTurns([]);
    setProblem(null);

    // 담아 둔 id 까지 버려야 다음 물음에서 새 대화가 열린다
    forgetChatId(browserChatIdStore);
  }

  return (
    <div className="ask">
      {/* 키가 없으면 아무것도 못 한다. 막지 말고 길을 알려 준다 */}
      {!apiKey && (
        <p className="ask-warn">
          {askNeedsKey.text} <Link href={askNeedsKey.href}>{askNeedsKey.link}</Link>
        </p>
      )}

      {/* 주고받은 말 */}
      <div className="ask-log" aria-live="polite">
        {/* 아직 아무 말도 안 했으면 무엇을 물을 수 있는지 보여 준다 */}
        {turns.length === 0 && !asking && (
          <div className="ask-samples">
            <p className="ask-samples-h">{askCopy.samplesLabel}</p>

            <ul>
              {askCopy.samples.map((s) => (
                <li key={s}>
                  {/* 누르면 그대로 물어본다. 타이핑 없이 한 번에 써 보게 한다 */}
                  <button type="button" onClick={() => ask(s)} disabled={!apiKey}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {turns.map((t, i) => (
          // 같은 말을 두 번 할 수 있어서 차례를 이름표에 함께 쓴다
          <Bubble key={`${i}-${t.content.slice(0, 12)}`} turn={t} />
        ))}

        {/* 기다리는 동안. 아무것도 안 보이면 눌린 건지 알 수 없다 */}
        {asking && (
          <div className="ask-bubble ask-bubble-bot ask-wait">
            <span className="ask-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {askCopy.thinking}
          </div>
        )}

        {/* 바닥 표시. 새 말이 붙으면 여기로 따라 내려간다 */}
        <div ref={bottom} />
      </div>

      {/* 묻는 칸 */}
      <form
        className="ask-form"
        onSubmit={(e) => {
          // 폼이 통째로 새로 고쳐지는 것을 막는다. 그러면 대화가 사라진다
          e.preventDefault();
          ask(draft);
        }}
      >
        <input
          className="ask-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={askCopy.placeholder}
          // 도메인이 정한 위쪽 한계를 입력칸에도 알려 준다
          maxLength={MAX_QUESTION}
          disabled={!apiKey}
          autoComplete="off"
        />

        <button className="ask-send" type="submit" disabled={!apiKey || asking}>
          <Icon name="arrow-right" size={18} />
          <span className="sr-only">{askCopy.send}</span>
        </button>
      </form>

      {/* 돌려보낸 까닭. 없어도 자리를 차지하게 둬서 칸이 위아래로 튀지 않게 한다 */}
      <p className="ask-msg" role="status">
        {problem}
      </p>

      {/* 키가 어디로 가는지 숨기지 않는다 */}
      <p className="ask-note">{askCopy.keyNote}</p>

      {/* 대화를 비우는 길. 단추보다 조용해야 한다 */}
      {turns.length > 0 && (
        <p className="ask-clear">
          <button type="button" onClick={onClear}>
            {askCopy.clear}
          </button>
        </p>
      )}
    </div>
  );
}

/** 말풍선 하나. 내가 한 말과 챗봇이 한 말이 같은 틀을 쓴다 */
function Bubble({ turn }: { turn: ChatTurn }) {
  const mine = turn.role === "user";

  return (
    <div className={mine ? "ask-bubble ask-bubble-me" : "ask-bubble ask-bubble-bot"}>
      {/* 줄바꿈을 살려서 보여 준다. HTML 로 해석하지 않으므로 안전하다 */}
      <p className="ask-text">{turn.content}</p>

      {/* 근거가 된 후기. 챗봇 말에만 붙는다 */}
      {turn.sources && turn.sources.length > 0 && (
        <div className="ask-src">
          <span className="ask-src-h">{askCopy.sourcesLabel}</span>

          <ul>
            {turn.sources.map((s, i) => (
              // 같은 요리의 후기가 여럿 걸릴 수 있어서 차례를 함께 쓴다
              <li key={`${s.dishId}-${i}`}>
                {/* 눌러서 원래 글로 갈 수 있어야 "근거" 가 뜻을 가진다 */}
                <Link href={`/posts/${s.dishId}`}>{s.dish}</Link>
                <span className="ask-src-chef">
                  {s.author} · 별점 {s.rating}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
