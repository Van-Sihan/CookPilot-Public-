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
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { isLastStep, moveStep, type StepCommand } from "@/lib/domain/cook-progress";
import { DEFAULT_SETUP, findCookSetup, watchCookSetup } from "@/lib/usecase/choose-cook-setup";
import { findDraft, watchDraft } from "@/lib/usecase/plan-recipe";
import { readStepNote, type CookSaid } from "@/lib/usecase/cook-along";
import { cookCopy, toneLabels } from "@/lib/cook-content";

export function CookShell() {
  /* 다 만들면 완성 화면으로 데려간다 */
  const router = useRouter();

  /* 담아 둔 레시피를 지켜본다. 한 번만 만들어야 부탁했다 취소했다 하지 않는다 */
  const watchRecipe = useCallback(
    (fn: () => void) => watchDraft(browserRecipeDraftStore, fn),
    [],
  );
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
  const setup = useSyncExternalStore(
    watchSetup,
    () => findCookSetup(browserCookSetupStore),
    () => DEFAULT_SETUP,
  );

  /* 지금 몇 번째 걸음인지. 새로 고치면 처음으로 돌아간다 —
     요리는 한자리에서 죽 하는 일이라 굳이 담아 두지 않는다 */
  const [stepIndex, setStepIndex] = useState(0);

  /* 걸어 둔 타이머들 */
  const [alarms, setAlarms] = useState<readonly CookAlarm[]>([]);

  /* 오간 말. 최근 것이 위로 오게 쌓는다 */
  const [said, setSaid] = useState<readonly CookSaid[]>([]);

  /* 말동무에게 글로 한마디 건네는 길. 이어져 있을 때만 채워진다.
     화면을 다시 그릴 까닭이 없는 값이라 상태가 아니라 ref 에 둔다 */
  const sayRef = useRef<((text: string) => void) | null>(null);

  /** 말동무가 이어지거나 끊길 때 그 길을 받아 둔다 */
  const onReady = useCallback((say: ((text: string) => void) | null) => {
    sayRef.current = say;
  }, []);

  /** 타이머를 하나 건다. 손으로도 말로도 여기로 들어온다 */
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
  const onCommand = useCallback((cmd: StepCommand) => {
    if (cmd === "next") setStepIndex((n) => moveStep(n, 1, totalRef.current));
    if (cmd === "prev") setStepIndex((n) => moveStep(n, -1, totalRef.current));
  }, []);

  /** 오간 말을 쌓는다 */
  const addSaid = useCallback((one: CookSaid) => {
    /* 너무 많이 쌓이면 화면이 무거워진다. 최근 스무 마디만 남긴다 —
       그보다 오래된 말을 다시 보는 일은 없다 */
    setSaid((prev) => [one, ...prev].slice(0, 20));
  }, []);

  /* 정해 둔 요리가 없으면 여기서 끝낸다 */
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
  const now = Math.min(stepIndex, total - 1);
  const step = recipe.steps[now];
  const last = isLastStep(now, total);

  /**
   * 이 걸음을 소리 내어 읽어 준다.
   *
   * 말동무가 이어져 있으면 그쪽에 시킨다 — 사람이 고른 목소리로 읽히고,
   * 브라우저 목소리와 번갈아 나와서 둘이 말하는 것처럼 들리는 일도 없다.
   * 안 이어져 있을 때만 브라우저에 딸린 읽어 주기로 넘어간다.
   */
  function readAloud() {
    const say = sayRef.current;

    if (say) {
      say(readStepNote(now, total, step.text));
      return;
    }

    // 여기서부터는 말동무가 없을 때의 대비책이다
    if (typeof speechSynthesis === "undefined") return;

    // 앞서 읽던 것이 있으면 끊는다. 안 그러면 줄줄이 쌓여서 계속 읽는다
    speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(step.text);

    // 한국어로 읽어 달라고 못 박는다. 안 하면 영어 목소리가 한글을 더듬는다
    utter.lang = "ko-KR";

    // 조금 느리게. 불 앞에서 한 번에 알아들어야 한다
    utter.rate = 0.95;

    speechSynthesis.speak(utter);
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
              onClick={readAloud}
              aria-label={cookCopy.readAloud}
              title={cookCopy.readAloud}
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
