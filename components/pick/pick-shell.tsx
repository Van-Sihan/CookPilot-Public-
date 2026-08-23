"use client";

/**
 * 음성 화면의 껍데기 — 왼쪽 기둥과 가운데를 나란히 놓고, 둘이 같이 보는 값을 쥔다.
 *
 * 고른 목소리·속도와 서재 권수는 왼쪽 기둥도 쓰고 가운데 카드도 쓴다. 각자 따로
 * 읽으면 한쪽에서 바꿨을 때 다른 쪽이 옛 값을 붙들고 있게 된다. 그래서 여기 한곳에서만
 * 읽고 아래로 내려 준다.
 *
 * 위쪽 머리말(로고와 네 걸음)은 움직일 일이 없어서 서버가 그린 채로 children 으로 받는다.
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import { PickCards } from "@/components/pick/pick-cards";
import { PickRail } from "@/components/pick/pick-rail";
import { VoiceConsole } from "@/components/pick/voice-console";
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { browserRecipeShelfStore } from "@/lib/adapter/browser-recipe-shelf-store";
import type { AnswerSpeed } from "@/lib/domain/gemini-model";
import {
  DEFAULT_SETUP,
  findCookSetup,
  keepCookSetup,
  watchCookSetup,
} from "@/lib/usecase/choose-cook-setup";
import {
  countShelfBooks,
  watchShelf,
} from "@/lib/usecase/keep-recipe-shelf";

export function PickShell({ children }: { children: React.ReactNode }) {
  /* 이번 방문에 몇 번 물었는지. 새로 고치면 0 으로 돌아간다 —
     "이번 세션" 이라는 말 그대로라서 일부러 담아 두지 않는다 */
  const [asked, setAsked] = useState(0);

  /* 몇 인분으로 만들지. 마이크 칸과 아래 카드들이 함께 보는 값이라
     한쪽이 쥐고 있으면 안 된다 — 화면 숫자와 실제 인분이 어긋난다 */
  const [servings, setServings] = useState(2);

  /* 고른 값이 바뀌면 알려 달라고 부탁하는 함수.
     화면을 다시 그릴 때마다 새로 만들면 부탁했다 취소했다를 끝없이 되풀이한다 */
  const watchSetup = useCallback(
    (onChange: () => void) => watchCookSetup(browserCookSetupStore, onChange),
    [],
  );

  /*
   * 골라 둔 목소리·속도. 이 값은 React 바깥(브라우저 저장 공간)에 있어서
   * 보통 쓰는 useState 로는 못 따라간다. 그래서 "바깥 값 지켜보기" 도구를 쓴다.
   * 서버에서 그릴 때는 늘 기본값이라고 답하게 해 두었다.
   */
  const setup = useSyncExternalStore(
    // 값이 바뀌면 알려 달라고 부탁하는 길
    watchSetup,
    // 브라우저에서 지금 값이 뭔지 읽어 오는 방법
    () => findCookSetup(browserCookSetupStore),
    // 서버에는 저장 공간이 없으니 늘 기본값으로 본다
    () => DEFAULT_SETUP,
  );

  /* 서재가 바뀌면 알려 달라고 부탁하는 함수. 위와 같은 까닭으로 한 번만 만든다 */
  const watchBooks = useCallback(
    (onChange: () => void) => watchShelf(browserRecipeShelfStore, onChange),
    [],
  );

  /* 서재에 꽂힌 권수. 숫자 하나라 값이 같으면 다시 그리지도 않는다 */
  const books = useSyncExternalStore(
    // 서재가 바뀌면 알려 달라고 부탁하는 길
    watchBooks,
    // 브라우저에서 지금 권수를 세는 방법
    () => countShelfBooks(browserRecipeShelfStore),
    // 서버에서는 셀 것이 없으니 0 으로 본다
    () => 0,
  );

  /** 왼쪽 기둥에서 속도를 바꿨을 때. 담아 두면 지켜보던 쪽이 알아서 다시 그린다 */
  function onSpeed(speed: AnswerSpeed) {
    // 말투는 그대로 두고 속도만 갈아 끼운다
    keepCookSetup({ ...setup, speed }, browserCookSetupStore);
  }

  return (
    <div className="pick">
      {/* 왼쪽 기둥. 값은 전부 여기서 내려 준다 */}
      <PickRail
        setup={setup}
        onSpeed={onSpeed}
        books={books}
        asked={asked}
        /* "전부 지우기" 는 담아 둔 것만 지운다. 이번 방문 횟수는 여기서 치운다 */
        onWipe={() => setAsked(0)}
      />

      {/* 가운데 — 머리말, 마이크, 다른 길 카드 */}
      <div className="pick-main">
        {/* 서버가 그려서 넘겨준 머리말. 움직일 일이 없어 그대로 놓기만 한다 */}
        {children}

        {/* 이 화면의 주인공 */}
        <VoiceConsole
          onAsk={() => setAsked((n) => n + 1)}
          servings={servings}
          onServings={setServings}
        />

        {/* 말 대신 다른 길로 시작하는 카드들 */}
        <PickCards setup={setup} servings={servings} />
      </div>
    </div>
  );
}
