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
 * 맨 오른쪽 브랜드 레시피는 광고를 파는 자리다. 살 사람을 기다리는 중이라
 * "준비 중" 이 아니라 "광고 모집중" 이라고 적는다.
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { geminiRecipeGateway } from "@/lib/adapter/gemini-recipe-gateway";
import type { CookSetup } from "@/lib/usecase/choose-cook-setup";
import { modelForSetup } from "@/lib/usecase/choose-cook-setup";
import { findSavedKey } from "@/lib/usecase/enter-with-api-key";
import { planFromFridge, planFromYoutube } from "@/lib/usecase/plan-recipe";
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

export function PickCards({ setup, servings }: Props) {
  const router = useRouter();

  /* 지금 고른 속도의 이름과 모델 별명. 카드에 "빠르게 · Flash-Lite" 처럼 붙는다 */
  const speed = answerSpeedCards.find((s) => s.id === setup.speed);

  /* 펼쳐진 카드. 둘을 한꺼번에 펼치면 어느 칸에 적는 중인지 헷갈린다 */
  const [open, setOpen] = useState<OpenCard>(null);

  /* 적고 있는 글자. 카드마다 따로 둔다 — 하나 접었다 펴도 적던 것이 남는다 */
  const [youtube, setYoutube] = useState("");
  const [fridge, setFridge] = useState("");

  /* 다녀오는 중인지. 기다리는 동안 또 누르면 두 번 다녀온다 */
  const [busy, setBusy] = useState(false);

  /* 안 됐을 때 칸 밑에 뜨는 말 */
  const [error, setError] = useState<string | null>(null);

  /** 두 길이 똑같이 하는 뒷일 — 되면 장보기로, 안 되면 까닭을 띄운다 */
  async function run(plan: () => Promise<{ ok: boolean; reason?: string }>) {
    // 기다리는 중에 또 누르면 무시한다
    if (busy) return;

    // 키가 없으면 다녀올 곳이 없다. 어디로 가야 하는지 알려 준다
    if (!findSavedKey(browserApiKeyStore)) {
      setError(pickCopy.needKey);
      return;
    }

    setBusy(true);
    setError(null);

    const result = await plan();

    setBusy(false);

    if (result.ok) {
      // 레시피를 담아 뒀으니 장보기 화면이 꺼내 쓴다
      router.push("/shop");
      return;
    }

    // 까닭에 맞는 말을 띄우고 이 화면에 머문다
    setError(planMessages[result.reason as keyof typeof planMessages]);
  }

  /** 지금 키로 만든 게이트웨이. 부를 때마다 새로 만든다 — 키가 바뀔 수 있다 */
  function gateway() {
    // 위에서 이미 키가 있는지 봤다. 없으면 여기까지 안 온다
    return geminiRecipeGateway(findSavedKey(browserApiKeyStore) ?? "", modelForSetup(setup));
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
        <form
          className="pk-open"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() =>
              planFromFridge(fridge, servings, gateway(), browserRecipeDraftStore),
            );
          }}
        >
          <label className="pk-open-l" htmlFor="pk-fridge">
            {pickCopy.fridgeLabel}
          </label>

          <div className="pk-open-row">
            <input
              className="pk-open-input"
              id="pk-fridge"
              value={fridge}
              onChange={(e) => setFridge(e.target.value)}
              placeholder={pickCopy.fridgePlaceholder}
              autoComplete="off"
            />

            <button className="btn btn-fill btn-sm" type="submit" disabled={busy}>
              {busy ? pickCopy.working : pickCopy.find}
            </button>
          </div>

          <p className="pk-open-note">{pickCopy.fridgeNote}</p>
        </form>
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
