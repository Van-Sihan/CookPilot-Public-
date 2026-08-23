"use client";

/**
 * 요리 화면의 껍데기.
 *
 * 지금 몇 번째 걸음인지, 걸어 둔 타이머가 무엇인지, 무슨 말이 오갔는지를 한곳에서 쥔다.
 * 마이크 자리와 타이머가 같은 값을 봐야 해서 여기 모았다 —
 * 각자 따로 들고 있으면 말로 건 타이머가 타이머 칸에 안 나타난다.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { CookTimer, type CookAlarm } from "@/components/cook/cook-timer";
import { LiveConsole } from "@/components/cook/live-console";
import { RecipeSteps } from "@/components/shop/recipe-steps";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { openSpeaker } from "@/lib/adapter/browser-audio";
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { speakWithBrowser, stopBrowserSpeech } from "@/lib/adapter/browser-speech";
import { previewVoice } from "@/lib/adapter/gemini-live-gateway";
import { isLastStep, moveStep, type StepCommand } from "@/lib/domain/cook-progress";
import { DEFAULT_SETUP, findCookSetup, watchCookSetup } from "@/lib/usecase/choose-cook-setup";
import { findSavedKey } from "@/lib/usecase/enter-with-api-key";
import { findDraft, watchDraft } from "@/lib/usecase/plan-recipe";
import { readStepNote, spokenStep, type CookSaid } from "@/lib/usecase/cook-along";
import { cookCopy, toneLabels } from "@/lib/cook-content";

// [F1][함수] CookShell(): 요리 화면의 껍데기
// 입력: 없음(담아 둔 레시피·설정) → 처리: 걸음·타이머·오간 말을 한곳에서 쥔다
// 출력: 화면(JSX). 마이크 자리와 타이머가 같은 값을 봐야 해서 여기 모았다
export function CookShell() {
  /* 다 만들면 완성 화면으로 데려간다 */
  const router = useRouter();

  /* 담아 둔 레시피를 지켜본다. 한 번만 만들어야 부탁했다 취소했다 하지 않는다 */
  const watchRecipe = useCallback(
    (fn: () => void) => watchDraft(browserRecipeDraftStore, fn),
    [],
  );
  // [F2][외부] ▷ useSyncExternalStore(watchRecipe, findDraft) → recipe
  const recipe = useSyncExternalStore(
    watchRecipe,
    () => findDraft(browserRecipeDraftStore),
    () => null,
  );

  /* 골라 둔 목소리·속도 */
  const watchSetup = useCallback(
    (fn: () => void) => watchCookSetup(browserCookSetupStore, fn),
    [],
  );
  // [F3][외부] ▷ useSyncExternalStore(watchSetup, findCookSetup) → setup(gender·tone·speed)
  const setup = useSyncExternalStore(
    watchSetup,
    () => findCookSetup(browserCookSetupStore),
    () => DEFAULT_SETUP,
  );

  /* 지금 몇 번째 걸음인지. 새로 고치면 처음으로 돌아간다 —
     요리는 한자리에서 죽 하는 일이라 굳이 담아 두지 않는다 */
  // [F4][흐름] 지금 걸음 → stepIndex / 걸어 둔 타이머 → alarms / 오간 말 → said
  const [stepIndex, setStepIndex] = useState(0);

  /* 걸어 둔 타이머들 */
  const [alarms, setAlarms] = useState<readonly CookAlarm[]>([]);

  /* 오간 말. 최근 것이 위로 오게 쌓는다 */
  const [said, setSaid] = useState<readonly CookSaid[]>([]);

  /* 말동무에게 글로 한마디 건네는 길. 이어져 있을 때만 채워진다.
     화면을 다시 그릴 까닭이 없는 값이라 상태가 아니라 ref 에 둔다 */
  // [F5][흐름] 말동무에게 글로 건네는 길 → sayRef (이어져 있을 때만 채워진다)
  const sayRef = useRef<((text: string) => void) | null>(null);

  /** 말동무가 이어지거나 끊길 때 그 길을 받아 둔다 */
  // [F6][함수] onReady(say): 말동무가 이어지거나 끊길 때 그 길을 받아 둔다
  // 입력: say 또는 null → 처리: sayRef 에 담음 → 출력: 없음 (LiveConsole 이 부른다)
  const onReady = useCallback((say: ((text: string) => void) | null) => {
    sayRef.current = say;
  }, []);

  /* 스피커 단추가 지금 소리를 내고 있는지. 다시 누르면 멈추는 단추로 바뀐다 */
  // [F7][흐름] 스피커 단추가 소리를 내는 중인지 → reading
  const [reading, setReading] = useState(false);

  /* 말동무 없이 읽힐 때 쓰는 것들.
     제미나이를 따로 부를 때는 웹소켓을 끊는 함수와 소리를 트는 자리가 함께 필요하다 */
  const hushRef = useRef<(() => void) | null>(null);
  const speakerRef = useRef<ReturnType<typeof openSpeaker> | null>(null);

  /** 스피커 단추로 읽던 것을 모두 끊는다 */
  // [F8][함수] hush(): 스피커 단추로 읽던 것을 모두 끊는다
  // 입력: 없음 → 처리: 웹소켓 끊기 + 스피커 닫기 + ▷ stopBrowserSpeech() → 출력: 없음
  const hush = useCallback(() => {
    // 제미나이 쪽 웹소켓
    hushRef.current?.();
    hushRef.current = null;

    // 소리를 틀던 자리
    speakerRef.current?.close();
    speakerRef.current = null;

    // 브라우저 읽어 주기
    stopBrowserSpeech();

    setReading(false);
  }, []);

  /* 화면을 떠날 때 읽던 소리가 남지 않게 한다 */
  useEffect(() => hush, [hush]);

  /** 타이머를 하나 건다. 손으로도 말로도 여기로 들어온다 */
  // [F9][함수] addAlarm(label, minutes): 타이머를 하나 건다
  // 입력: label + minutes → 처리: 끝나는 시각을 셈해 alarms 에 붙임 → 출력: 없음
  // 손으로 건 것(CookTimer:F6)과 말로 건 것(live-console → cook-progress:F17)이 여기로 모인다
  const addAlarm = useCallback((label: string, minutes: number) => {
    setAlarms((prev) => [
      ...prev,
      {
        /* 번호는 만들 때 정한다. 시각을 그대로 쓰면 같은 순간에 두 개를 걸 때 겹치는데,
           randomUUID 는 그럴 일이 없다 */
        id: crypto.randomUUID(),
        label,
        // 끝나는 시각을 담아 둔다. 남은 시간은 타이머 칸이 그때그때 셈한다
        endsAt: Date.now() + minutes * 60_000,
        // 첫 번째 초침이 오기 전에 보여 줄 길이
        seconds: minutes * 60,
      },
    ]);
  }, []);

  /* 걸음이 모두 몇 개인지. 아래 onCommand 가 봐야 하는데, 그 함수는 한 번만
     만들어지므로 지금 값을 그대로 가두면 옛 숫자를 계속 보게 된다 */
  const totalRef = useRef(0);
  useEffect(() => {
    totalRef.current = recipe?.steps.length ?? 0;
  }, [recipe]);

  /**
   * 말로 내린 걸음 명령을 처리한다.
   *
   * "다시" 는 여기 안 온다. 걸음을 옮기지 않는 명령이라 마이크 자리가 직접
   * 한 번 더 읽어 달라고 시키는 편이 짧다.
   */
  // [F10][함수] onCommand(cmd): 말로 내린 걸음 명령을 처리한다
  // 입력: 'next'|'prev' → 처리: moveStep(domain/cook-progress:F1) → 출력: 없음
  // 'repeat' 는 여기 안 온다 — live-console 이 직접 다시 읽어 달라고 시킨다
  const onCommand = useCallback((cmd: StepCommand) => {
    if (cmd === "next") setStepIndex((n) => moveStep(n, 1, totalRef.current));
    if (cmd === "prev") setStepIndex((n) => moveStep(n, -1, totalRef.current));
  }, []);

  /** 오간 말을 쌓는다 */
  // [F11][함수] addSaid(one): 오간 말을 쌓는다(최근 스무 마디만)
  // 입력: CookSaid → 처리: 앞에 붙이고 slice(0,20) → 출력: 없음
  const addSaid = useCallback((one: CookSaid) => {
    /* 너무 많이 쌓이면 화면이 무거워진다. 최근 스무 마디만 남긴다 —
       그보다 오래된 말을 다시 보는 일은 없다 */
    setSaid((prev) => [one, ...prev].slice(0, 20));
  }, []);

  /* 정해 둔 요리가 없으면 여기서 끝낸다 */
  // [F12][분기] 정해 둔 요리 없음 → true: '요리 고르러 가기' 를 그리고 끝낸다 / false: F13
  if (!recipe) {
    return (
      <div className="shop-empty">
        <p className="shop-empty-t">아직 정해 둔 요리가 없습니다.</p>
        <Link className="btn btn-fill" href="/pick">
          요리 고르러 가기
        </Link>
      </div>
    );
  }

  /* 걸음이 모두 몇 개인지. 아래 함수들이 이 값을 여러 번 쓰는데, 그 안에서
     recipe 를 다시 들여다보면 "없을 수도 있는 값" 이라고 타입이 막는다 —
     위에서 이미 없으면 돌아갔지만, 나중에 불릴 수도 있는 함수라 그렇다 */
  const total = recipe.steps.length;

  // 지금 걸음. 레시피가 바뀌어 범위를 벗어나도 화면이 안 깨지게 붙들어 둔다
  // [F13][흐름] stepIndex 를 범위 안으로 → now / recipe.steps[now] → step
  // [F13][호출] isLastStep(domain/cook-progress:F4) → last
  const now = Math.min(stepIndex, total - 1);
  const step = recipe.steps[now];
  const last = isLastStep(now, total);

  /**
   * 이 걸음을 소리 내어 읽어 준다.
   *
   * **마이크 단추의 말동무와 같은 목소리로** 읽혀야 한다. 여기만 다른 목소리가
   * 나오면 같은 안내가 아니라 딴 사람이 끼어든 것처럼 들린다. 그래서 셋을 차례로 본다.
   *
   *   ① 말동무가 이어져 있으면 그쪽에 시킨다 — 바로 그 목소리다.
   *   ② 마이크가 꺼져 있어도 키가 있으면 같은 성별·말투로 제미나이를 따로 부른다.
   *      말동무를 부르는 것과 목소리 이름이 같은 표에서 나오므로 소리도 같다.
   *   ③ 키까지 없을 때만 브라우저에 딸린 읽어 주기로 내려간다.
   *      그때도 고른 성별에 가까운 한국어 목소리를 찾아 쓴다.
   *
   * ①②에는 모델에게 주는 지시문(readStepNote)을 보내고, ③에는 사람이 듣는 말
   * (spokenStep)을 바로 읽힌다. 둘을 바꿔 쓰면 안 된다 — 지시문을 브라우저에
   * 그대로 넘기면 "[읽기] 1/10 걸음. 아래 따옴표 안의…" 까지 소리 내어 읽는다.
   * 두 함수가 같은 글을 쥐고 있어서 어느 길로 가든 들리는 말은 같다.
   */
  // [F14][함수] readAloud(): 이 걸음을 소리 내어 읽어 준다
  // 입력: now·step·setup → 처리: 세 갈래(말동무 / 제미나이 따로 / 브라우저) → 출력: 없음
  // 어느 길로 가든 **같은 목소리**여야 한다. 그래서 셋 다 같은 표를 쓴다
  function readAloud() {
    // 모델에게 줄 지시문
    // [F15][호출] readStepNote(usecase/cook-along:F6) → note (모델에게 줄 지시문)
    // [F15][호출] spokenStep(usecase/cook-along:F5) → line (사람이 들을 말)
    const note = readStepNote(now, total, step.text);

    // 브라우저가 받은 그대로 읽을 말
    const line = spokenStep(step.text);

    // ① 말동무가 이어져 있으면 그쪽에 시킨다
    const say = sayRef.current;
    // [F16][분기] ① 말동무가 이어져 있음 → true: session.say(note) 로 끝낸다 / false: F17
    if (say) {
      say(note);
      return;
    }

    // 앞서 읽던 것이 남아 있으면 먼저 끊는다. 안 끊으면 둘이 겹쳐 들린다
    hush();

    // [F17][호출] findSavedKey(usecase:F7) → key
    const key = findSavedKey(browserApiKeyStore);

    // ③ 키가 없으면 제미나이를 부를 길이 없다. 브라우저 목소리로 내려간다
    // [F18][분기] ③ 키가 없음 → true: speakWithBrowser(adapter/browser-speech:F8) 로 내려간다
    // false: F19
    if (!key) {
      setReading(speakWithBrowser(line, setup.gender, setup.tone, () => setReading(false)));
      return;
    }

    // ② 마이크는 꺼져 있어도 같은 목소리를 한 문장만 빌려 온다
    // [F19][외부] ▷ openSpeaker(browser-audio:F19) → speaker → unblock()
    const speaker = openSpeaker();
    speakerRef.current = speaker;

    /* 사람이 단추를 눌러서 여기 왔으므로 브라우저가 소리를 막지 않는다.
       그래도 혹시 모르니 한 번 풀어 준다 */
    void speaker.unblock();

    setReading(true);

    // [F20][외부] ② key + setup.gender + setup.tone + note ▷ previewVoice(gemini-live-gateway:F19)
    // 말동무와 **같은 표**(voiceFor)에서 목소리를 고르므로 소리가 같다
    // [F20][분기] problem 이 오면 → speakWithBrowser 로 한 번 더 내려간다
    hushRef.current = previewVoice(
      key,
      setup.gender,
      setup.tone,
      note,
      (pcm) => speakerRef.current?.push(pcm),
      (problem) => {
        hushRef.current = null;
        setReading(false);

        /* 키가 거절됐거나 못 이었으면 그냥 조용해지는 대신 브라우저 목소리로 읽는다 —
           불 앞에서 아무 소리도 안 나는 것이 가장 나쁘다 */
        if (problem) {
          setReading(speakWithBrowser(line, setup.gender, setup.tone, () => setReading(false)));
        }
      },
    );
  }

  return (
    <div className="ck">
      {/* ---------- 왼쪽: 물어보기와 지금 할 일 ---------- */}
      <div className="ck-main">
        <LiveConsole
          recipe={recipe}
          gender={setup.gender}
          tone={setup.tone}
          stepIndex={now}
          onSaid={addSaid}
          onTimer={addAlarm}
          onCommand={onCommand}
          onReady={onReady}
        />

        {/* 지금 할 일 */}
        <section className="ck-now">
          <h2 className="ck-h2">
            <span aria-hidden="true">🔥</span> {cookCopy.nowLabel}
          </h2>

          <div className="ck-card">
            {/* 걸음마다 한 칸씩 차오르는 막대 */}
            <div className="ck-track" aria-hidden="true">
              {recipe.steps.map((_, i) => (
                <span key={i} data-on={i <= now ? "" : undefined} />
              ))}
            </div>

            {/* 몇 번째인지 */}
            <p className="ck-step-n">
              <span className="ck-step-tag">
                {now === 0 ? "첫단계" : last ? "마지막" : `${now + 1}단계`}
              </span>
              {String(now + 1).padStart(2, "0")} / {String(recipe.steps.length).padStart(2, "0")}
            </p>

            {/* 이 화면에서 가장 크게 보여야 하는 글. 불 앞에서 멀리서도 읽혀야 한다 */}
            <p className="ck-step-t">{step.text}</p>

            {/* 시간이 걸리는 걸음이면 타이머를 한 번에 걸 수 있게 해 준다 */}
            {step.minutes ? (
              <button
                className="btn btn-line btn-sm ck-step-timer"
                type="button"
                onClick={() => addAlarm(step.text.slice(0, 12), step.minutes as number)}
              >
                <Icon name="timer" size={15} /> {step.minutes}분 타이머 걸기
              </button>
            ) : null}

            {/* 손이 젖어 화면을 못 볼 때. 글자 없이 그림 하나로 둔다 —
                불 앞에서는 읽는 것보다 알아보는 것이 빠르다.
                눈에 안 보이는 이름표를 달아 읽어 주는 기계에도 뜻이 전해지게 한다 */}
            <button
              className="ck-read"
              type="button"
              /* 읽는 중에 또 누르면 멈춘다. 잘못 눌렀을 때 끝까지 기다릴 일이 없다 */
              onClick={() => (reading ? hush() : readAloud())}
              aria-label={reading ? cookCopy.readStop : cookCopy.readAloud}
              title={reading ? cookCopy.readStop : cookCopy.readAloud}
              /* 소리가 나는 동안 단추 모습이 바뀐다. CSS 가 이 표시를 본다 */
              data-on={reading ? "" : undefined}
            >
              <Icon name="speaker" size={20} />
            </button>
          </div>

          {/* 앞뒤로 옮기는 단추 둘 */}
          <div className="ck-move">
            <button
              className="btn btn-line"
              type="button"
              onClick={() => setStepIndex((n) => moveStep(n, -1, total))}
              disabled={now === 0}
            >
              {cookCopy.prev}
            </button>

            <button
              className="btn btn-line"
              type="button"
              onClick={() => setStepIndex((n) => moveStep(n, 1, total))}
              disabled={last}
            >
              {cookCopy.next}
            </button>
          </div>

          {/* 접어 둔 재료 목록 */}
          <details className="ck-fold">
            <summary>
              <i className="shop-arrow" aria-hidden="true" />
              <span aria-hidden="true">🥬</span> {cookCopy.ingredients}{" "}
              {recipe.ingredients.length}가지
            </summary>

            <ul className="ck-ing">
              {recipe.ingredients.map((i) => (
                <li key={i.name}>
                  <span>{i.name}</span>
                  <span className="ck-ing-amount">{i.amount}</span>
                </li>
              ))}
            </ul>
          </details>

          {/* 접어 둔 전체 순서. 장보기 화면과 같은 것을 쓴다 */}
          <details className="ck-fold">
            <summary>
              <i className="shop-arrow" aria-hidden="true" />
              <span aria-hidden="true">🍳</span> {cookCopy.allSteps}
            </summary>

            <RecipeSteps steps={recipe.steps} now={now} />
          </details>

          {/* 앞뒤 화면으로 가는 길 */}
          <div className="ck-move">
            <Link className="btn btn-line" href="/shop">
              {cookCopy.toShop}
            </Link>

            <button
              className="btn btn-fill"
              type="button"
              onClick={() => router.push("/cook/done")}
            >
              {cookCopy.finish}
            </button>
          </div>
        </section>
      </div>

      {/* ---------- 오른쪽: 타이머와 오간 말 ---------- */}
      <aside className="ck-side">
        <CookTimer
          alarms={alarms}
          onAdd={addAlarm}
          onDrop={(id) => setAlarms((prev) => prev.filter((a) => a.id !== id))}
          /* 다음 걸음으로 옮기기만 한다. 옮기면 말동무가 알아서 새 걸음을 읽어 준다 —
             여기서 또 읽으라고 시키면 같은 말이 두 번 나온다 */
          onAskNext={() => setStepIndex((n) => moveStep(n, 1, total))}
        />

        <div className="ck-said">
          <h2 className="ck-h2">
            <span aria-hidden="true">💭</span> {cookCopy.saidLabel}
            {/* 지금 어떤 목소리로 안내 중인지 작게 밝혀 둔다 */}
            <span className="ck-tone">{toneLabels[setup.tone]} 목소리</span>
          </h2>

          {said.length === 0 ? (
            <p className="ck-empty">{cookCopy.saidEmpty}</p>
          ) : (
            <ul className="ck-said-list">
              {said.map((s, i) => (
                // 같은 말을 두 번 할 수 있어서 차례를 이름표로 쓴다. 앞에만 쌓이니 괜찮다
                <li key={i} data-who={s.who}>
                  <span className="ck-said-who">{s.who === "me" ? "나" : "쿡파일럿"}</span>
                  <span className="ck-said-t">{s.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
