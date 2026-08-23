"use client";

/**
 * 말 대신 다른 길로 시작하는 카드 세 장.
 *
 * 유튜브 옮기기와 냉장고 찾기는 글자를 다루는 일이라, 왼쪽 기둥에서 고른
 * 답변 속도에 따라 부르는 모델이 달라진다. 그래서 카드에 지금 어느 쪽인지 적어 준다.
 * 어떤 모델 이름인지는 이 파일이 모른다 — 별명만 받아다 보여 준다.
 *
 * 단추를 누르면 **카드 안에서** 적는 칸이 펼쳐진다. 다른 화면으로 보내지 않는
 * 까닭은 하는 일이 한 줄 적는 것뿐이기 때문이다 — 화면을 옮기면 왜 왔는지
 * 잊어버리고, 뒤로 돌아올 길도 만들어야 한다.
 *
 * 두 길이 하는 일이 다르다.
 *   · 유튜브는 영상 하나에 레시피 하나라 곧장 장보기로 넘어간다.
 *   · 냉장고는 **먼저 후보를 늘어놓고 고르게 한다.** 재료만 적었을 때 무엇이
 *     나올지는 사람도 모르는데, 우리가 하나를 골라 던지면 마음에 안 들 때
 *     처음부터 다시 적는 수밖에 없다.
 *
 * 맨 오른쪽 브랜드 레시피는 광고를 파는 자리다. 살 사람을 기다리는 중이라
 * "준비 중" 이 아니라 "광고 모집중" 이라고 적는다.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { geminiRecipeGateway } from "@/lib/adapter/gemini-recipe-gateway";
import type { FridgeIdea } from "@/lib/domain/recipe";
import type { CookSetup } from "@/lib/usecase/choose-cook-setup";
import { modelForSetup } from "@/lib/usecase/choose-cook-setup";
import { findSavedKey } from "@/lib/usecase/enter-with-api-key";
import {
  findFridgeIdeas,
  planFromFridgeIdea,
  planFromYoutube,
} from "@/lib/usecase/plan-recipe";
import { planMessages } from "@/lib/cook-content";
import { answerSpeedCards, brandSamples, pickCards, pickCopy } from "@/lib/site-content";

/** 껍데기가 넘겨주는 것 */
type Props = {
  /** 지금 골라 둔 목소리·속도. 여기서는 속도만 쓴다 */
  setup: CookSetup;
  /** 몇 인분으로 만들지. 가운데 화면에서 고른 값을 그대로 받는다 */
  servings: number;
};

/** 지금 어느 카드가 펼쳐져 있는지. 하나만 펼쳐진다 */
type OpenCard = "youtube" | "fridge" | "brand" | null;

/** 까닭 낱말을 사람이 읽을 말로 바꾼다. 두 길이 같은 표를 쓴다 */
// [F1][함수] messageFor(reason): 까닭 낱말을 사람이 읽을 말로 바꾼다
// 입력: reason → 처리: planMessages 표 조회 → 출력: 문장
function messageFor(reason: string): string {
  return (
    planMessages[reason as keyof typeof planMessages] ?? planMessages.unreachable
  );
}

// [F2][함수] PickCards({setup, servings}): 말 대신 다른 길로 시작하는 카드 세 장
// 입력: setup(속도) + servings → 처리: 유튜브·냉장고·브랜드 세 갈래 → 출력: 화면(JSX)
export function PickCards({ setup, servings }: Props) {
  const router = useRouter();

  /* 지금 고른 속도의 이름과 모델 별명. 카드에 "빠르게 · Flash-Lite" 처럼 붙는다 */
  const speed = answerSpeedCards.find((s) => s.id === setup.speed);

  /* 펼쳐진 카드. 둘을 한꺼번에 펼치면 어느 칸에 적는 중인지 헷갈린다 */
  // [F3][흐름] 펼쳐진 카드 → open / 적는 글자 → youtube, fridge / 후보 → ideas
  // 다녀오는 중 → busy / 어느 후보를 만드는 중 → making / 잔소리 → error
  const [open, setOpen] = useState<OpenCard>(null);

  /* 적고 있는 글자. 카드마다 따로 둔다 — 하나 접었다 펴도 적던 것이 남는다 */
  const [youtube, setYoutube] = useState("");
  const [fridge, setFridge] = useState("");

  /* 냉장고 재료로 찾아 온 요리 후보들. 고르기 전까지 여기 머문다 */
  const [ideas, setIdeas] = useState<readonly FridgeIdea[]>([]);

  /* 다녀오는 중인지. 기다리는 동안 또 누르면 두 번 다녀온다 */
  const [busy, setBusy] = useState(false);

  /* 지금 어느 후보의 레시피를 만드는 중인지. 그 카드의 단추만 바뀐다 —
     전부 "만드는 중" 이 되면 무엇을 눌렀는지 알 수 없다 */
  const [making, setMaking] = useState<string | null>(null);

  /* 안 됐을 때 칸 밑에 뜨는 말 */
  const [error, setError] = useState<string | null>(null);

  /** 다녀오기 전에 늘 확인하는 것 — 기다리는 중인지, 키가 있는지 */
  // [F4][함수] ready(): 다녀오기 전에 늘 확인하는 것(기다리는 중인지·키가 있는지)
  // 입력: 없음 → 처리: busy 확인 + findSavedKey → 출력: boolean
  function ready(): boolean {
    // 기다리는 중에 또 누르면 무시한다
    if (busy) return false;

    // 키가 없으면 다녀올 곳이 없다. 어디로 가야 하는지 알려 준다
    if (!findSavedKey(browserApiKeyStore)) {
      setError(pickCopy.needKey);
      return false;
    }

    return true;
  }

  /** 지금 키로 만든 게이트웨이. 부를 때마다 새로 만든다 — 키가 바뀔 수 있다 */
  // [F5][함수] gateway(): 지금 키·속도로 게이트웨이를 하나 만든다
  // 입력: 없음 → 처리: geminiRecipeGateway(key, modelForSetup(setup)) → 출력: RecipeGateway
  // 부를 때마다 새로 만든다 — 키나 속도가 바뀔 수 있다
  function gateway() {
    // 위에서 이미 키가 있는지 봤다. 없으면 여기까지 안 온다
    return geminiRecipeGateway(findSavedKey(browserApiKeyStore) ?? "", modelForSetup(setup));
  }

  /** 레시피를 받아 왔을 때의 뒷일 — 되면 장보기로, 안 되면 까닭을 띄운다 */
  // [F6][함수] run(plan): 레시피를 받아 왔을 때의 뒷일(유튜브 길이 쓴다)
  // 입력: plan(부를 유스케이스) → 처리: 실행 후 성공하면 /shop → 출력: 없음(비동기)
  async function run(plan: () => Promise<{ ok: boolean; reason?: string }>) {
    if (!ready()) return;

    setBusy(true);
    setError(null);

    // [F7][외부] ▷ plan() — planFromYoutube(usecase:F8) 를 부른다 → result
    const result = await plan();

    setBusy(false);

    // [F8][분기] result.ok → true: ▷ router.push('/shop') / false: 까닭을 띄우고 머문다
    if (result.ok) {
      // 레시피를 담아 뒀으니 장보기 화면이 꺼내 쓴다
      router.push("/shop");
      return;
    }

    // 까닭에 맞는 말을 띄우고 이 화면에 머문다
    setError(messageFor(result.reason ?? "unreachable"));
  }

  /** 냉장고 재료로 만들 수 있는 요리 후보를 찾는다. 첫 걸음 */
  // [F9][함수] onFindIdeas(): 냉장고 재료로 요리 후보를 찾는다(첫 걸음)
  // 입력: fridge(적은 재료) + servings → 처리: findFridgeIdeas → 출력: 없음(ideas 를 채운다)
  async function onFindIdeas() {
    if (!ready()) return;

    setBusy(true);
    setError(null);

    /* 앞서 찾아 둔 후보를 먼저 지운다. 안 지우면 새 재료로 찾는 동안
       옛 재료로 나온 후보가 그대로 앉아 있어서 다 된 줄 안다 */
    // [F10][흐름] 앞서 찾아 둔 후보를 먼저 지운다(안 지우면 옛 재료의 후보가 앉아 있다)
    setIdeas([]);

    // [F11][외부] fridge + servings + gateway(F5) ▷ findFridgeIdeas(usecase:F12) → result
    const result = await findFridgeIdeas(fridge, servings, gateway());

    setBusy(false);

    // [F12][분기] result.ok → true: setIdeas(후보 카드가 뜬다) / false: 까닭을 띄운다
    if (result.ok) {
      setIdeas(result.ideas);
      return;
    }

    setError(messageFor(result.reason));
  }

  /** 후보 하나를 골랐을 때. 그 요리만 레시피로 만든다. 두 번째 걸음 */
  // [F13][함수] onPickIdea(idea): 후보 하나를 골랐을 때(두 번째 걸음)
  // 입력: idea + fridge(가진 재료) + servings → 처리: planFromFridgeIdea → 출력: 없음
  async function onPickIdea(idea: FridgeIdea) {
    if (!ready()) return;

    setBusy(true);
    setMaking(idea.title);
    setError(null);

    // [F14][외부] idea.title + fridge + servings + gateway(F5) + store
    // ▷ planFromFridgeIdea(usecase:F13) → result
    const result = await planFromFridgeIdea(
      idea.title,
      fridge,
      servings,
      gateway(),
      browserRecipeDraftStore,
    );

    setBusy(false);
    setMaking(null);

    // [F15][분기] result.ok → true: ▷ router.push('/shop') / false: 까닭을 띄운다
    if (result.ok) {
      router.push("/shop");
      return;
    }

    setError(messageFor(result.reason));
  }

  return (
    <section className="pk">
      {/* 이 묶음이 무엇인지 알려 주는 줄 */}
      <h2 className="pk-head">{pickCopy.otherWays}</h2>

      {/* 카드 세 장. 좁은 화면에서는 아래 CSS 가 한 줄로 쌓아 준다 */}
      <div className="pk-grid">
        {pickCards.map((card) => (
          <article
            className="pk-card"
            // 제목이 서로 안 겹치니 그대로 이름표로 쓴다
            key={card.title}
            /* 광고 자리는 테두리 색이 다르다. CSS 가 이 표시를 보고 고른다 */
            data-ad={card.ad ? "" : undefined}
          >
            {/* 카드 윗줄 — 그림, 제목, 광고 표시 */}
            <h3 className="pk-title">
              {/* 무슨 카드인지 한눈에 알려 주는 그림. 뜻은 옆 글씨가 알려 주니 숨긴다 */}
              <span className="pk-ico" aria-hidden="true">
                <Icon name={card.icon} size={18} />
              </span>
              {card.title}

              {/* 광고는 광고라고 밝혀야 한다. 작게 두되 숨기지는 않는다 */}
              {card.ad && <span className="pk-ad">AD</span>}
            </h3>

            {/* 이 카드가 무엇을 해 주는지 */}
            <p className="pk-desc">{card.desc}</p>

            {/* 글자 모델을 쓰는 카드에만 지금 어느 속도로 도는지 적어 준다.
                왼쪽 기둥에서 바꾸면 이 줄도 같이 바뀐다 */}
            {card.usesModel && speed && (
              <p className="pk-model">
                {/* 지금 고른 속도 이름 */}
                {speed.name}
                {/* 두 값을 가운뎃점으로 잇는다. 꾸미기용이라 숨긴다 */}
                <span aria-hidden="true"> · </span>
                {/* 어떤 모델인지 알려 주는 별명 */}
                {speed.badge}
              </p>
            )}

            {/* 누르면 아래 칸이 펼쳐진다. 다시 누르면 접힌다 */}
            <button
              className="btn btn-line btn-sm pk-go"
              type="button"
              onClick={() => {
                setError(null);
                setOpen((now) => (now === card.id ? null : (card.id as OpenCard)));
              }}
              // 지금 펼쳐져 있는지 읽어 주는 기계에도 알린다
              aria-expanded={open === card.id}
            >
              {open === card.id
                ? pickCopy.close
                : card.ad
                  ? pickCopy.adWanted
                  : card.action}
            </button>
          </article>
        ))}
      </div>

      {/* ---------- 펼쳐지는 칸 ----------
          카드 아래 한 자리에서 펼친다. 카드 안에 넣으면 그 카드만 길어져서
          세 장의 높이가 어긋난다 */}

      {open === "youtube" && (
        <form
          className="pk-open"
          onSubmit={(e) => {
            // 폼이 통째로 새로 고쳐지면 적던 것이 사라진다
            e.preventDefault();
            void run(() =>
              planFromYoutube(youtube, servings, gateway(), browserRecipeDraftStore),
            );
          }}
        >
          <label className="pk-open-l" htmlFor="pk-youtube">
            {pickCopy.youtubeLabel}
          </label>

          <div className="pk-open-row">
            <input
              className="pk-open-input"
              id="pk-youtube"
              value={youtube}
              onChange={(e) => setYoutube(e.target.value)}
              placeholder={pickCopy.youtubePlaceholder}
              // 주소 칸이라 자동 대문자와 맞춤법 검사를 끈다
              autoComplete="off"
              spellCheck={false}
              inputMode="url"
            />

            <button className="btn btn-fill btn-sm" type="submit" disabled={busy}>
              {busy ? pickCopy.working : pickCopy.bring}
            </button>
          </div>

          {/* 무엇이 일어나는지 미리 알려 준다. 영상을 보는 일이라 조금 걸린다 */}
          <p className="pk-open-note">{pickCopy.youtubeNote}</p>
        </form>
      )}

      {open === "fridge" && (
        <>
          <form
            className="pk-open"
            onSubmit={(e) => {
              e.preventDefault();
              void onFindIdeas();
            }}
          >
            <label className="pk-open-l" htmlFor="pk-fridge">
              {pickCopy.fridgeLabel}
            </label>

            {/* 한 줄짜리 칸에서 여러 줄로 바꿨다. 재료를 대여섯 가지 적으면
                한 줄 칸에서는 앞이 밀려 나가 무엇을 적었는지 안 보인다 */}
            <textarea
              className="pk-open-area"
              id="pk-fridge"
              rows={3}
              value={fridge}
              onChange={(e) => {
                setFridge(e.target.value);

                /* 재료를 고치면 앞서 찾은 후보는 더 이상 그 재료의 답이 아니다.
                   남겨 두면 안 적은 재료로 만든 요리를 고르게 된다 */
                setIdeas([]);
              }}
              placeholder={pickCopy.fridgePlaceholder}
              autoComplete="off"
            />

            <button className="btn btn-fill pk-open-go" type="submit" disabled={busy}>
              {busy && making === null ? pickCopy.working : pickCopy.find}
            </button>

            <p className="pk-open-note">{pickCopy.fridgeNote}</p>
          </form>

          {/* 찾아 온 후보들. 고르기 전까지는 아무것도 담아 두지 않는다 */}
          {ideas.length > 0 && (
            <section className="pk-ideas">
              <h3 className="pk-ideas-h">{pickCopy.ideasLabel}</h3>

              <ul className="pk-idea-grid">
                {ideas.map((idea) => (
                  // 요리 이름이 서로 안 겹치니 그대로 이름표로 쓴다
                  <li className="pk-idea" key={idea.title}>
                    <h4 className="pk-idea-t">{idea.title}</h4>

                    {/* 왜 이걸 골랐는지. 가진 재료를 어떻게 쓰는지가 적혀 있다 */}
                    {idea.why && <p className="pk-idea-why">{idea.why}</p>}

                    {/* 고를 때 가장 크게 갈리는 두 가지 — 시간과 더 사야 하는 것 */}
                    <p className="pk-idea-meta">
                      {/* 시간을 못 받았으면 그 자리를 비운다. 지어내지 않는다 */}
                      {idea.minutes > 0 && <span>약 {idea.minutes}분</span>}

                      {idea.minutes > 0 && <span aria-hidden="true"> · </span>}

                      {idea.missing.length > 0
                        ? `${pickCopy.ideaMissing}: ${idea.missing.join(", ")}`
                        : pickCopy.ideaHaveAll}
                    </p>

                    <button
                      className="btn btn-fill btn-sm pk-idea-go"
                      type="button"
                      onClick={() => void onPickIdea(idea)}
                      // 하나를 만드는 동안 다른 것을 또 누르지 못하게 막는다
                      disabled={busy}
                    >
                      {making === idea.title ? pickCopy.ideaWorking : pickCopy.ideaMake}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {open === "brand" && (
        <div className="pk-open">
          <p className="pk-open-l">{pickCopy.brandLabel}</p>

          {/* 광고가 붙으면 이런 모습이 된다는 것을 보여 주는 예시.
              누를 수 있게 두면 진짜 광고인 줄 알기 때문에 잠가 둔다 */}
          <ul className="pk-brands">
            {brandSamples.map((b) => (
              <li className="pk-brand" key={b.title}>
                <span className="pk-brand-name">
                  {b.brand}
                  <span className="pk-ad">AD</span>
                </span>
                <span className="pk-brand-title">{b.title}</span>
                <button className="btn btn-line btn-sm" type="button" disabled>
                  {pickCopy.brandStart}
                </button>
              </li>
            ))}
          </ul>

          <p className="pk-open-note">{pickCopy.brandNote}</p>
        </div>
      )}

      {/* 안 됐을 때 까닭. 펼친 칸 아래 한 자리에 모아 둔다 */}
      {error && (
        <p className="pk-error" role="status">
          {error}
        </p>
      )}
    </section>
  );
}
