"use client";

/**
 * 음성 화면 한가운데 — 마이크 단추와 불꽃처럼 흔들리는 소리 그림, 인분 고르기.
 *
 * 하는 일은 셋이다.
 *   1. 마이크를 열고 말소리를 담는다
 *   2. 소리 크기를 막대 높이로 옮겨 그린다
 *   3. 말이 끝나면 레시피를 받아 오고 장보기 화면으로 넘어간다
 *
 * 마이크를 여닫는 방법도, 제미나이에 다녀오는 방법도 여기서는 모른다.
 * 어댑터와 유스케이스가 맡고, 이 파일은 부르고 그리기만 한다.
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { geminiRecipeGateway } from "@/lib/adapter/gemini-recipe-gateway";
import { openMic, type Mic } from "@/lib/adapter/browser-audio";
import { findSavedKey } from "@/lib/usecase/enter-with-api-key";
import { findCookSetup, modelForSetup } from "@/lib/usecase/choose-cook-setup";
import { planFromSpeech } from "@/lib/usecase/plan-recipe";
import { micMessages, pickCopy } from "@/lib/site-content";
import { planMessages } from "@/lib/cook-content";

/** 막대 개수. 홀수라야 한가운데 막대가 딱 하나 생겨서 좌우가 대칭이 된다 */
const BAR_COUNT = 41;

/** 한가운데 막대의 자리. 가운데에서 얼마나 떨어졌는지 잴 때마다 쓴다 */
const MID = (BAR_COUNT - 1) / 2;

/**
 * 소리가 없을 때 막대가 서 있는 기본 높이(0~1).
 *
 * `Math.random()` 을 쓰지 않는다. 서버가 그린 화면과 브라우저가 그린 첫 화면의
 * 막대 높이가 달라지면 React 가 "내용이 어긋난다" 고 화를 낸다.
 * 그래서 몇 번째 막대인지만 넣으면 늘 같은 값이 나오는 셈으로 대신한다.
 */
// [F1][함수] idleShape(i): 소리가 없을 때 막대 i 가 서 있는 높이
// 입력: i(막대 차례) → 처리: 가운데가 높고 바깥이 낮은 곡선 + 흔들림 → 출력: 0~1 숫자
function idleShape(i: number): number {
  // 가운데에서 얼마나 떨어졌는지. 가운데면 0, 양 끝이면 1
  const away = Math.abs(i - MID) / MID;

  // 가장자리로 갈수록 부드럽게 낮아지는 산 모양. 직선으로 깎으면 삼각형이 되어 딱딱하다
  const fall = Math.cos((away * Math.PI) / 2);

  // 산 모양만 쓰면 너무 반듯해서 불꽃이 아니라 언덕이 된다. 막대마다 들쭉날쭉하게 흔든다
  const wobble = 0.55 + 0.45 * Math.abs(Math.sin(i * 2.399));

  // 양 끝 막대가 아예 사라지면 그림이 끊겨 보인다. 최소 높이를 남긴다
  return Math.max(0.06, fall * wobble);
}

/** 막대 하나가 쓸 값을 미리 다 구해 둔다. 그릴 때마다 다시 셈할 까닭이 없다 */
const IDLE = Array.from({ length: BAR_COUNT }, (_, i) => idleShape(i));

/** 껍데기가 넘겨주는 것 */
type Props = {
  /** 마이크를 켤 때마다 알린다. 왼쪽 기둥의 "이번 세션 질문" 이 이 숫자를 쓴다 */
  onAsk: () => void;
  /**
   * 몇 인분으로 만들지.
   *
   * 여기서 쥐고 있던 값을 껍데기로 올렸다. 아래 카드들(유튜브·냉장고)도
   * 같은 값을 써야 하는데, 각자 쥐고 있으면 화면에 보이는 숫자와
   * 실제로 만들어지는 인분이 어긋난다.
   */
  servings: number;
  /** 인분을 바꿔 달라고 껍데기에 알린다 */
  onServings: (next: number) => void;
};

// [F2][함수] VoiceConsole({onAsk, servings, onServings}): 말로 요리를 정하는 마이크 자리
// 입력: onAsk(물은 횟수 올리기) + servings + onServings → 출력: 화면(JSX)
export function VoiceConsole({ onAsk, servings, onServings }: Props) {
  /* 레시피를 받고 나면 장보기 화면으로 데려간다 */
  const router = useRouter();

  /* 지금 듣고 있는 중인지 */
  // [F3][흐름] 듣는 중 → listening / 다녀오는 중 → thinking / 잔소리 → error
  const [listening, setListening] = useState(false);

  /* 레시피를 받아 오는 중인지. 이때는 단추를 잠가 둔다 */
  const [thinking, setThinking] = useState(false);

  /* 잘못됐을 때 띄우는 말. 할 말이 없으면 null */
  const [error, setError] = useState<string | null>(null);

  /* 막대 하나하나를 가리키는 손잡이. 소리가 바뀔 때마다 React 를 거치지 않고 바로 고친다.
     1초에 60번 화면을 다시 그리게 하면 브라우저가 버티지 못한다 */
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  /* 지금 열려 있는 마이크. 끌 때 필요하다 */
  // [F4][흐름] 열어 둔 마이크 → micRef / 그림 프레임 번호 → frameRef
  const micRef = useRef<Mic | null>(null);

  /* 다음 그림 예약표. 끌 때 이 번호로 예약을 취소한다 */
  const frameRef = useRef(0);

  /** 막대를 소리 없는 기본 모습으로 되돌린다 */
  const resetBars = useCallback(() => {
    barsRef.current.forEach((el, i) => el?.style.setProperty("--h", String(IDLE[i])));
  }, []);

  /** 마이크를 놓고 그림을 멈춘다. 소리는 돌려주지 않는다 */
  // [F5][함수] closeMic(): 마이크와 그림을 함께 거둔다
  // 입력: 없음 → 처리: cancelAnimationFrame + mic.stop() → 출력: 없음
  const closeMic = useCallback(() => {
    // 예약해 둔 다음 컷을 취소한다
    cancelAnimationFrame(frameRef.current);

    // 마이크를 놓아 준다. 이걸 안 하면 주소창의 빨간 점이 계속 켜져 있다
    micRef.current?.stop();
    micRef.current = null;

    setListening(false);
    resetBars();
  }, [resetBars]);

  /** 마이크를 켜고 소리를 막대에 옮기기 시작한다 */
  // [F6][함수] start(): 마이크를 켜고 소리 그림을 움직인다
  // 입력: 없음 → 처리: 키 확인 → openMic → requestAnimationFrame 반복 → 출력: 없음(비동기)
  async function start() {
    // 다시 켜는 것이니 지난번 잔소리는 치운다
    setError(null);

    // 키가 없으면 다녀올 데가 없다. 마이크부터 켜고 나서 알려 주면 헛수고다
    // [F7][분기] 담아 둔 키 없음 → true: 안내를 띄우고 멈춤(마이크도 안 켠다) / false: F8
    if (findSavedKey(browserApiKeyStore) === null) {
      setError("API 키가 없습니다. 시작 화면에서 먼저 키를 넣어 주세요.");
      return;
    }

    // 마이크를 여는 일은 통째로 어댑터에 맡긴다
    // [F8][외부] ▷ openMic(adapter/browser-audio:F2) — 권한 창이 뜬다 → opened
    const opened = await openMic();

    // 못 열었으면 까닭에 맞는 말을 띄운다
    // [F9][분기] 못 열었음 → true: 까닭에 맞는 말을 띄우고 멈춤 / false: F10
    if (!opened.ok) {
      setError(micMessages[opened.problem === "denied" ? "denied" : opened.problem]);
      return;
    }

    micRef.current = opened.mic;
    setListening(true);

    /* 물어본 횟수를 하나 올린다. 왼쪽 기둥이 이 숫자를 보여 준다 */
    // [F10][호출] onAsk() → PickShell 의 asked 를 하나 올린다(왼쪽 기둥이 보여 준다)
    onAsk();

    // 막대마다 지금 높이. 저울 값을 그대로 쓰면 튀어서, 조금씩 따라가게 한다
    const levels = new Float32Array(BAR_COUNT);

    /** 한 컷 그리기. 브라우저가 화면을 새로 그릴 때마다 한 번씩 불린다 */
    // [F11][반복] requestAnimationFrame 으로 한 컷씩 — mic.level() 을 막대 높이에 옮긴다
    // 끝나는 조건: closeMic(F5) 이 cancelAnimationFrame 을 부를 때
    const draw = () => {
      // 지금 소리가 얼마나 큰지. 재는 방법은 어댑터가 안다
      const loud = micRef.current?.level() ?? 0;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        /* 가운데가 가장 크게 솟고 바깥으로 갈수록 낮아진다.
           거기에 지금 소리 크기를 얹으면 말할 때마다 불꽃이 커진다 */
        const target = Math.min(1, IDLE[i] * (0.28 + loud * 2.4));

        // 목표까지 한 번에 가지 않고 3분의 1쯤씩 다가간다. 그래야 물결처럼 움직인다
        levels[i] += (target - levels[i]) * 0.34;

        barsRef.current[i]?.style.setProperty("--h", levels[i].toFixed(3));
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
  }

  /** 다 말했다. 소리를 챙겨 제미나이에 다녀오고 다음 화면으로 넘어간다 */
  // [F12][함수] finish(): 다 말했다. 소리를 챙겨 레시피를 받아 오고 장보기로 간다
  // 입력: 없음 → 처리: toWav → planFromSpeech → 출력: 없음(비동기)
  async function finish() {
    const mic = micRef.current;
    if (!mic) return;

    // 마이크를 놓기 전에 담아 둔 소리를 먼저 챙긴다. 놓고 나면 못 꺼낸다
    // [F13][호출] mic.toWav()(browser-audio:F14·F16) → clip {base64, mimeType}
    // 마이크를 놓기 **전에** 챙긴다. 놓고 나면 못 꺼낸다
    const clip = mic.toWav();

    closeMic();
    setThinking(true);

    // 키와 답변 속도를 꺼내 온다
    // [F14][호출] findSavedKey(usecase:F7) → key / findCookSetup(usecase:F4) → setup
    const key = findSavedKey(browserApiKeyStore);
    const setup = findCookSetup(browserCookSetupStore);

    // 마이크를 켤 때 확인했지만, 그사이에 다른 탭에서 지웠을 수도 있다
    // [F15][분기] 그사이 키가 지워짐(다른 탭) → true: 안내를 띄우고 멈춤 / false: F16
    if (!key) {
      setThinking(false);
      setError("API 키가 없습니다. 시작 화면에서 먼저 키를 넣어 주세요.");
      return;
    }

    /* 소리를 알아듣고 레시피를 만드는 일을 한 번에 시킨다.
       어느 모델을 부를지는 고른 답변 속도가 정한다 */
    // [F16][호출] clip + servings + geminiRecipeGateway(key, modelForSetup(setup)) + store
    // → planFromSpeech(usecase/plan-recipe:F1) → result
    const result = await planFromSpeech(
      clip,
      servings,
      geminiRecipeGateway(key, modelForSetup(setup)),
      browserRecipeDraftStore,
    );

    setThinking(false);

    // 안 됐으면 까닭에 맞는 말을 띄우고 이 화면에 머문다
    // [F17][분기] result.ok → false: 까닭을 띄우고 이 화면에 머문다 / true: F18
    if (!result.ok) {
      setError(planMessages[result.reason]);
      return;
    }

    // 레시피를 담아 뒀으니 장보기 화면이 꺼내 쓴다
    // [F18][반환] 레시피가 담겼으니 ▷ router.push('/shop')
    router.push("/shop");
  }

  /* 화면을 떠날 때 마이크가 켜진 채로 남지 않게 한다.
     이 정리를 빠뜨리면 다른 페이지로 넘어가도 마이크 표시가 켜져 있다 */
  // [F19][흐름] 화면을 떠날 때 마이크와 그림을 거둔다(안 거두면 마이크 표시가 켜진 채 남는다)
  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current);
      micRef.current?.stop();
    };
  }, []);

  /* 단추를 눌렀을 때 무슨 일이 벌어질지. 세 갈래라 여기서 한 번에 정한다 */
  // [F20][분기] 단추를 눌렀을 때 — thinking 이면 무시 / listening 이면 finish(F12) / 아니면 start(F6)
  const onMic = () => {
    if (thinking) return;
    if (listening) void finish();
    else void start();
  };

  return (
    <div className="vc">
      {/* 제목 위에 붙는 작은 머리말 */}
      <p className="eyebrow hot vc-eyebrow">{pickCopy.eyebrow}</p>

      {/* 이 화면에서 던지는 하나뿐인 물음 */}
      <h1 className="vc-title">{pickCopy.title}</h1>

      {/* 지금 무엇을 해야 하는지가 갈래마다 달라서 안내 글도 바뀐다 */}
      <p className="vc-lead">
        {thinking
          ? "레시피를 만드는 중입니다…"
          : listening
            ? pickCopy.listening
            : pickCopy.lead}
      </p>

      {/* 마이크 단추. 이 화면에서 가장 크고 눈에 띄어야 한다 */}
      <button
        className="vc-mic"
        type="button"
        onClick={onMic}
        // 다녀오는 동안에는 눌러도 소용이 없다
        disabled={thinking}
        aria-label={listening ? "다 말했어요" : "말하기 시작"}
        aria-pressed={listening}
        // 듣는 중에만 테두리가 숨 쉬듯 번지게 CSS 에 표시를 남긴다
        data-live={listening ? "" : undefined}
      >
        <Icon name="mic" size={34} />
      </button>

      {/* 소리 그림. 상태를 글씨로 알려 주는 문장이 바로 위에 있어서 읽어 주는 기계에는 숨긴다 */}
      <div className="fl" aria-hidden="true" data-live={listening ? "" : undefined}>
        {IDLE.map((h, i) => (
          <span
            className="fl-bar"
            key={i}
            ref={(el) => {
              barsRef.current[i] = el;
            }}
            /* CSS 변수 세 개를 막대에 직접 매달아 준다. style 은 정해진 이름만
               받는 자리라, 우리끼리 쓰는 이름은 타입을 한 번 눌러 줘야 들어간다 */
            style={
              {
                // 지금 높이
                "--h": String(h),
                // 막대마다 흔들리기 시작하는 때를 조금씩 늦춘다
                "--d": (i * 0.045).toFixed(3) + "s",
                // 가운데면 1, 양 끝이면 0. 가장자리를 사그라든 숯처럼 흐리게 만든다
                "--f": (1 - Math.abs(i - MID) / MID).toFixed(3),
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 잘못됐을 때만 나오는 잔소리 */}
      {error && (
        <p className="vc-error" role="alert">
          {error}
        </p>
      )}

      {/* 몇 인분으로 만들지. 레시피를 만들 때 함께 넘어간다 */}
      <div className="vc-serv">
        <p className="vc-serv-label" id="serv-label">
          {pickCopy.servingsLabel}
        </p>

        <div className="vc-serv-row">
          <output className="vc-serv-n" aria-labelledby="serv-label">
            {servings}
          </output>

          <button
            className="vc-serv-btn"
            type="button"
            onClick={() => onServings(Math.max(1, servings - 1))}
            disabled={servings <= 1}
            aria-label="한 명 줄이기"
          >
            −
          </button>

          <button
            className="vc-serv-btn"
            type="button"
            onClick={() => onServings(Math.min(12, servings + 1))}
            disabled={servings >= 12}
            aria-label="한 명 늘리기"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
