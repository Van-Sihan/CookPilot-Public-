"use client";

/**
 * 요리를 마친 뒤 보는 화면.
 *
 * 하는 일은 셋이다 — 표지를 고르고, 서재에 꽂고, 다 쓴 재료를 다시 담게 해 준다.
 *
 * 표지를 사진이 아니라 CSS 로 그린다. 요리 사진은 사람이 찍어야 하는데
 * 지금은 사진을 올리는 길이 없고, 없는 사진 자리를 빈 네모로 두면 초라하다.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/brand";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { browserRecipeShelfStore } from "@/lib/adapter/browser-recipe-shelf-store";
import { DEFAULT_MALL, searchUrl, type ShoppingMall } from "@/lib/domain/shopping";
import { findDraft, forgetDraft, watchDraft } from "@/lib/usecase/plan-recipe";
import { countShelfBooks, shelveRecipe, watchShelf } from "@/lib/usecase/keep-recipe-shelf";
import { drawRecipeCard } from "@/lib/recipe-card";
import {
  coverColors,
  coverToneLabels,
  coverTones,
  doneCopy,
  mallLabels,
  sponsoredFor,
  wonText,
  type CoverTone,
} from "@/lib/cook-content";

/** 표지에 쓸 수 있는 색조 하나 */

export function DoneShell() {
  /* 새 요리를 시작할 때 데려간다 */
  const router = useRouter();

  /* 방금 만든 레시피 */
  const watchRecipe = useCallback(
    (fn: () => void) => watchDraft(browserRecipeDraftStore, fn),
    [],
  );
  const recipe = useSyncExternalStore(
    watchRecipe,
    () => findDraft(browserRecipeDraftStore),
    () => null,
  );

  /* 서재에 몇 권 있는지. 저장하고 나면 이 숫자가 늘어난다 */
  const watchBooks = useCallback(
    (fn: () => void) => watchShelf(browserRecipeShelfStore, fn),
    [],
  );
  const books = useSyncExternalStore(
    watchBooks,
    () => countShelfBooks(browserRecipeShelfStore),
    () => 0,
  );

  /* 고른 표지 색 */
  const [tone, setTone] = useState<CoverTone>("ember");

  /* 어느 쇼핑몰로 보낼지 */
  const [mall] = useState<ShoppingMall>(DEFAULT_MALL);

  /* 저장하거나 내려받고 나서 띄우는 한 줄 */
  const [note, setNote] = useState<string | null>(null);

  /* 표지를 그림 파일로 만들 때 쓰는 자리. 화면에는 안 보인다 */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* 만든 요리가 없으면 여기서 끝낸다 */
  if (!recipe) {
    return (
      <div className="shop-empty">
        <p className="shop-empty-t">마친 요리가 없습니다.</p>
        <Link className="btn btn-fill" href="/pick">
          요리 고르러 가기
        </Link>
      </div>
    );
  }

  /* 이번에 쓴 재료 중 광고가 걸린 것들의 값을 더한다.
     실제로 낸 돈이 아니라 "스폰서 상품 기준" 이라는 것을 화면에도 밝혀 둔다 */
  const sponsoredTotal = recipe.ingredients.reduce(
    (sum, i) => sum + (sponsoredFor(i.name)?.price ?? 0),
    0,
  );

  /** 서재에 꽂는다 */
  function onShelve() {
    const result = shelveRecipe(
      {
        /* 번호와 시각을 여기서 만들어 넘긴다. 유스케이스 안에서 만들면
           같은 값을 넣어도 매번 결과가 달라져 시험할 수가 없다 */
        id: crypto.randomUUID(),
        title: recipe!.title,
        savedAt: new Date().toISOString(),
        servings: recipe!.servings,
        cover: tone,
        // 레시피를 통째로 담아 둔다. 그래야 다음에 AI 없이 바로 꺼내 쓴다
        recipe: recipe,
      },
      browserRecipeShelfStore,
    );

    // 담지 못했으면 까닭을 알려 준다
    if (!result.ok) {
      setNote("브라우저가 저장을 막고 있습니다. 시크릿 창이라면 일반 창에서 해 보세요.");
      return;
    }

    setNote(`레시피북에 꽂았습니다. 지금 ${result.count}권입니다.`);
  }

  /** 표지를 그림 파일로 만들어 내려받는다 */
  /**
   * 표지를 그린다.
   *
   * 예전에는 요리 이름만 큼직하게 얹은 그림이었다. 그것만으로는 서재에 꽂아
   * 두어도 나중에 무엇을 어떻게 만들었는지 알 수 없다. 그래서 **인포그래픽**으로
   * 바꿨다 — 로고와 이름, 요리명과 인분, 재료, 그리고 1번부터 끝까지의 순서.
   *
   * 캔버스에 직접 그리는 까닭은 파일로 내려받아야 하기 때문이다. HTML 로
   * 그려 두면 화면에는 예쁘지만 그림 파일로 저장할 길이 없다.
   */
  function onDownloadCover() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 그리는 일은 글쓰기 화면과 같은 함수가 한다. 두 벌로 두면 어긋난다
    drawRecipeCard(canvas, recipe!, tone);

    /* 그림을 파일로 내려받는다. 화면에 안 붙인 링크를 만들어 대신 눌러 준다 */
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${recipe!.title}-레시피카드.png`;
    a.click();

    setNote(doneCopy.coverDone);
  }

  return (
    <div className="dn">
      {/* 다 만들었다는 알림 */}
      <div className="dn-banner">
        <h1 className="dn-title">
          {recipe.title} {doneCopy.titleTail}
        </h1>
        <p className="dn-lead">{doneCopy.lead}</p>
      </div>

      <div className="dn-body">
        {/* ---------- 왼쪽: 표지 ---------- */}
        <div className="dn-cover-col">
          <h2 className="ck-h2">
            <span aria-hidden="true">🖼</span> {doneCopy.coverLabel}
          </h2>

          {/* 표지. 사진 없이 CSS 로 그린다 */}
          <div
            className="dn-cover"
            style={
              {
                "--cover-top": coverColors[tone][0],
                "--cover-bottom": coverColors[tone][1],
              } as React.CSSProperties
            }
          >
            <Logo size={54} id="cover" />
            <p className="dn-cover-title">{recipe.title}</p>
            <p className="dn-cover-serv">{recipe.servings}인분</p>
          </div>

          {/* 표지 색 고르기 */}
          <fieldset className="dn-tones">
            <legend className="sr-only">표지 색</legend>

            {coverTones.map((t) => (
              <label className="dn-tone" key={t} data-on={tone === t ? "" : undefined}>
                <input
                  type="radio"
                  name="cover-tone"
                  className="sr-only"
                  checked={tone === t}
                  onChange={() => setTone(t)}
                />
                {/* 색만 보여 주는 동그라미 */}
                <span
                  className="dn-swatch"
                  aria-hidden="true"
                  style={{ background: coverColors[t][0] }}
                />
                {coverToneLabels[t]}
              </label>
            ))}
          </fieldset>

          {/* AI 로 그림을 그리는 것은 유료 요금제에서만 된다.
              잠가 두고 "준비 중" 이라고만 적으면 왜 안 되는지 알 수 없다.
              무엇 때문에 막혔고 대신 무엇이 만들어지는지 밝힌다 */}
          <p className="dn-paid">
            <span aria-hidden="true">⚠</span> {doneCopy.coverPaidWarn}
          </p>

          <button className="btn btn-fill dn-go" type="button" onClick={onDownloadCover}>
            <span aria-hidden="true">🖼</span> {doneCopy.coverPlain}
          </button>

          {/* 그림을 그리는 자리. 화면에는 안 보이고 내려받을 때만 쓴다 */}
          <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
        </div>

        {/* ---------- 오른쪽: 서재와 재료 ---------- */}
        <div className="dn-side">
          <h2 className="ck-h2">
            <span aria-hidden="true">📚</span> {doneCopy.shelfLabel}
          </h2>

          <p className="dn-note">{doneCopy.shelfNote}</p>

          <button className="btn btn-fill dn-go" type="button" onClick={onShelve}>
            <span aria-hidden="true">♡</span> {doneCopy.shelfSave}
          </button>

          {/* 저장 결과. 나타나는 순간 읽어 주는 기계가 알려 준다 */}
          {note && (
            <p className="dn-msg" role="status">
              {note}
            </p>
          )}

          <h2 className="ck-h2 dn-h2-gap">
            <span aria-hidden="true">🛒</span> {doneCopy.againLabel}
          </h2>

          {/* 이번에 쓴 재료를 검색으로 이어 준다 */}
          <div className="dn-again">
            <ul className="dn-again-list">
              {recipe.ingredients.map((i) => (
                <li key={i.name}>
                  <a href={searchUrl(mall, i.name)} target="_blank" rel="noreferrer noopener">
                    {i.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* 값이 걸린 재료가 있을 때만 합계를 보여 준다 */}
            {sponsoredTotal > 0 && (
              <p className="dn-total">
                스폰서 상품 기준 약 {wonText(sponsoredTotal)}
              </p>
            )}
          </div>

          <p className="dn-note">
            {mallLabels[mall]} {doneCopy.againNote}
          </p>

          <h2 className="ck-h2 dn-h2-gap">{doneCopy.nextLabel}</h2>

          <div className="dn-next">
            {/* 서재 화면이 생겼다. 이제 진짜로 데려간다 */}
            {/* 만든 요리를 커뮤니티에 올린다. ?from=cook 이 붙으면
                글쓰기 화면이 이 요리로 미리 채워 준다 */}
            <Link className="btn btn-line" href="/write?from=cook">
              <span aria-hidden="true">✍</span> {doneCopy.toCommunity}
            </Link>

            <Link className="btn btn-line" href="/shelf">
              <span aria-hidden="true">📚</span> {doneCopy.toShelf} ({books}권)
            </Link>

            <button
              className="btn btn-line"
              type="button"
              onClick={() => {
                /* 담아 둔 레시피를 버려야 고르기 화면이 처음부터 시작한다.
                   안 버리면 장보기 화면에 지난 요리가 그대로 남아 있다 */
                forgetDraft(browserRecipeDraftStore);
                router.push("/pick");
              }}
            >
              <span aria-hidden="true">🔍</span> {doneCopy.newDish}
            </button>
          </div>

          <Link className="btn btn-line dn-back" href="/cook">
            {doneCopy.backToCook}
          </Link>
        </div>
      </div>
    </div>
  );
}
