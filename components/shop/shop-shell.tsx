"use client";

/**
 * 장보기 화면의 껍데기.
 *
 * 담아 둔 레시피를 꺼내 오고, 무엇을 살지 체크를 쥔다.
 * 어느 쇼핑몰로 보낼지·검색 주소를 어떻게 만드는지는 도메인이 안다.
 *
 * 정해 둔 요리가 없으면 여기서 막는다. 빈 화면을 보여 주는 것보다
 * "먼저 요리를 고르세요" 하고 돌려보내는 편이 낫다.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { RecipeSteps } from "@/components/shop/recipe-steps";
import { YoutubeSource } from "@/components/shop/youtube-source";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import type { Ingredient } from "@/lib/domain/recipe";
import {
  MAX_BULK_OPEN,
  SHOPPING_MALLS,
  DEFAULT_MALL,
  searchUrl,
  shoppingListText,
  type ShoppingMall,
} from "@/lib/domain/shopping";
import { findDraft, watchDraft } from "@/lib/usecase/plan-recipe";
import { mallLabels, shopCopy, sponsoredFor, wonText } from "@/lib/cook-content";

// [F1][함수] ShopShell(): 장보기 화면의 껍데기
// 입력: 없음(담아 둔 레시피) → 처리: 체크 목록·쇼핑몰·복사·출처 → 출력: 화면(JSX)
export function ShopShell() {
  /* 요리 화면으로 넘어갈 때 쓴다 */
  const router = useRouter();

  /* 담아 둔 레시피가 바뀌면 알려 달라고 부탁하는 함수.
     화면을 다시 그릴 때마다 새로 만들면 부탁했다 취소했다를 되풀이한다 */
  const watch = useCallback(
    (onChange: () => void) => watchDraft(browserRecipeDraftStore, onChange),
    [],
  );

  /* 지금 하려는 요리. 브라우저 저장 공간에 있어서 "바깥 값 지켜보기" 로 따라간다 */
  // [F2][외부] ▷ useSyncExternalStore(watch, findDraft) → recipe
  const recipe = useSyncExternalStore(
    watch,
    () => findDraft(browserRecipeDraftStore),
    // 서버에는 저장 공간이 없으니 늘 "없음" 으로 본다
    () => null,
  );

  /* 어느 쇼핑몰로 보낼지. 이 화면에서만 쓰는 값이라 담아 두지 않는다 */
  // [F3][흐름] 고른 쇼핑몰 → mall / 체크를 **뺀** 재료 이름 → unchecked / 복사했는지 → copied
  // 체크한 것이 아니라 뺀 것을 담는 까닭 — 레시피가 바뀌어도 기본 상태가 살아 있다
  const [mall, setMall] = useState<ShoppingMall>(DEFAULT_MALL);

  /*
   * 체크를 뺀 재료의 이름들.
   *
   * "담은 것" 이 아니라 "뺀 것" 을 담아 두는 까닭 — 레시피가 바뀌면 재료도 바뀌는데,
   * 담은 것을 세어 두면 없어진 재료가 계속 장바구니에 남는다.
   * 뺀 것만 기억하면 목록이 바뀌어도 저절로 맞아떨어진다.
   */
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(() => new Set());

  /* 목록을 글자로 복사했을 때 잠깐 띄우는 말 */
  const [copied, setCopied] = useState(false);

  /*
   * 처음에 체크를 빼 둘 재료 — 집에 늘 있는 양념들.
   * 레시피가 바뀌면 다시 셈해야 해서 레시피에 매달아 둔다.
   */
  // [F4][흐름] recipe.ingredients 중 pantry 인 것 → pantryNames (처음에 체크가 빠져 있다)
  const pantryNames = useMemo(
    () => new Set(recipe?.ingredients.filter((i) => i.pantry).map((i) => i.name) ?? []),
    [recipe],
  );

  /** 이 재료가 지금 장바구니에 담겨 있는지 */
  // [F5][함수] isChecked(name): 그 재료가 지금 체크돼 있는지
  // 입력: name → 처리: unchecked 와 pantryNames 를 함께 본다 → 출력: boolean
  const isChecked = (name: string) =>
    // 사람이 직접 뺀 것이 먼저다. 그다음이 "집에 있는 것" 기본값이다
    unchecked.has(name) ? false : !pantryNames.has(name);

  /** 체크를 뒤집는다 */
  // [F6][함수] toggle(name): 체크를 뒤집는다
  // 입력: name → 처리: unchecked 집합에 넣거나 뺀다 → 출력: 없음
  function toggle(name: string) {
    setUnchecked((prev) => {
      // Set 은 고쳐 쓰면 React 가 못 알아챈다. 늘 새로 만들어 넘긴다
      const next = new Set(prev);

      /* 지금 담겨 있으면 "뺀 것" 명단에 올리고, 빠져 있으면 명단에서 지운다.
         집에 있는 양념을 다시 담을 때도 이 한 줄로 처리된다 */
      if (isChecked(name)) next.add(name);
      else next.delete(name);

      return next;
    });
  }

  /* 지금 담긴 재료들. 아래 여러 군데가 이 값을 쓴다 */
  // [F7][반복] ingredients 를 훑어 체크된 것만 남긴다 → cart (장바구니)
  const cart: readonly Ingredient[] = useMemo(
    () => recipe?.ingredients.filter((i) => isChecked(i.name)) ?? [],
    // isChecked 가 이 둘을 보고 답하므로 둘이 바뀔 때만 다시 센다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipe, unchecked, pantryNames],
  );

  /* 정해 둔 요리가 없으면 여기서 끝낸다. 아래 화면은 레시피가 있어야 그릴 수 있다 */
  // [F8][분기] 정해 둔 요리 없음 → true: '요리 고르러 가기' 를 그리고 끝낸다 / false: 아래를 그린다
  if (!recipe) {
    return (
      <div className="shop-empty">
        {/* 왜 빈 화면인지 밝혀 준다 */}
        <p className="shop-empty-t">아직 정해 둔 요리가 없습니다.</p>

        {/* 갈 곳을 함께 준다. 여기서 막다른 길이 되면 안 된다 */}
        <Link className="btn btn-fill" href="/pick">
          요리 고르러 가기
        </Link>
      </div>
    );
  }

  /** 목록을 글자로 옮겨 클립보드에 넣는다 */
  // [F9][함수] copyList(): 장보기 목록을 클립보드로 복사한다
  // 입력: cart → 처리: shoppingListText(domain/shopping:F6) → ▷ navigator.clipboard
  // 출력: 없음(비동기)
  async function copyList() {
    try {
      // 어떤 모양으로 옮길지는 도메인이 정한다. 화면마다 다르면 곤란하다
      await navigator.clipboard.writeText(shoppingListText([...cart]));
      setCopied(true);
    } catch {
      /* 클립보드를 막아 둔 브라우저가 있다. 그래도 아래 글상자에 그대로 보이니
         사람이 직접 긁어 복사할 수 있다 — 굳이 잔소리를 띄우지 않는다 */
    }
  }

  return (
    <div className="shop">
      {/* ---------- 왼쪽: 재료와 장보기 ---------- */}
      <div className="shop-main">
        {/* 무슨 요리를 얼마나 만드는지 한눈에 */}
        <div className="shop-head">
          <p className="shop-badges">
            {/* 레시피가 준비됐다는 표시 */}
            <span className="shop-ready">레시피 준비 완료</span>
            {/* 인분·걸음 수·재료 수. 가운뎃점으로 잇는다 */}
            <span className="shop-meta">
              {recipe.servings}인분 · {String(recipe.steps.length).padStart(2, "0")}단계 ·
              재료 {recipe.ingredients.length}가지
            </span>
          </p>

          {/* 이 화면에서 가장 큰 글씨 */}
          <h1 className="shop-title">{recipe.title}</h1>
        </div>

        {/* 재료 묶음의 제목 */}
        <h2 className="shop-h2">
          <span className="shop-h2-ico" aria-hidden="true">
            <Icon name="fridge" size={17} />
          </span>
          {shopCopy.title}
        </h2>

        {/* 어느 쇼핑몰로 보낼지 */}
        <fieldset className="shop-malls">
          <legend className="shop-malls-label">{shopCopy.mallLabel}</legend>

          {SHOPPING_MALLS.map((id) => (
            // 줄 전체가 이름표라 어디를 눌러도 골라진다
            <label className="shop-mall" key={id}>
              <input
                type="radio"
                name="mall"
                className="sr-only"
                checked={mall === id}
                onChange={() => setMall(id)}
              />
              {/* 진짜 라디오는 숨겨 놨으니 이 동그라미가 대신 보인다 */}
              <span className="shop-mall-dot" aria-hidden="true" />
              {mallLabels[id]}
            </label>
          ))}
        </fieldset>

        {/* 왜 어떤 것은 체크가 빠져 있는지 미리 알려 둔다 */}
        <p className="shop-note">{shopCopy.pantryNote}</p>

        {/* 재료 목록 */}
        <ul className="shop-items">
          {recipe.ingredients.map((item) => {
            // 이 재료에 걸리는 광고가 있는지
            const ad = sponsoredFor(item.name);

            return (
              <li key={item.name}>
                {/* 재료 한 줄 — 체크, 이름, 분량, 검색 단추 */}
                <div className="shop-row">
                  <label className="shop-check">
                    <input
                      type="checkbox"
                      checked={isChecked(item.name)}
                      onChange={() => toggle(item.name)}
                    />
                    {/* 이름표는 읽어 주는 기계만 읽는다. 옆에 이름이 이미 보인다 */}
                    <span className="sr-only">{item.name} 장바구니에 담기</span>
                  </label>

                  {/* 재료 이름 */}
                  <span className="shop-name">{item.name}</span>

                  {/* 얼마나 */}
                  <span className="shop-amount">{item.amount}</span>

                  {/* 고른 쇼핑몰에서 이 재료를 찾아 준다 */}
                  <a
                    className="shop-go"
                    href={searchUrl(mall, item.name)}
                    target="_blank"
                    // 새 탭이 이 페이지를 건드리지 못하게 막는다
                    rel="noreferrer noopener"
                    aria-label={`${mallLabels[mall]}에서 ${item.name} 찾기`}
                  >
                    <Icon name="search" size={15} />
                  </a>
                </div>

                {/* 광고 자리. 재료 바로 밑에 붙어야 무엇에 딸린 것인지 알 수 있다 */}
                {ad && (
                  <div className="shop-row shop-ad">
                    {/* 광고는 광고라고 밝힌다. 작게 두되 숨기지 않는다 */}
                    <span className="shop-ad-tag">AD</span>

                    <span className="shop-name">{ad.name}</span>

                    <span className="shop-amount">
                      {ad.size} · {wonText(ad.price)}
                    </span>

                    <a
                      className="shop-go"
                      // 상품 이름 그대로 검색한다. 우리가 파는 것이 아니라 찾아 주는 것이다
                      href={searchUrl(mall, ad.name)}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${mallLabels[mall]}에서 ${ad.name} 찾기`}
                    >
                      <Icon name="search" size={15} />
                    </a>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* 지금 몇 개가 담겼는지 */}
        <p className="shop-cart">
          {shopCopy.cartLabel}
          <span className="shop-cart-n">{cart.length}개</span>
        </p>

        {/*
          여러 개를 한 번에 여는 자리.
          단추 하나로 창을 여러 개 띄우지 않는다 — 브라우저가 첫 번째만 열고
          나머지는 팝업으로 보고 막아 버린다. 그래서 링크를 늘어놓고
          사람이 직접 누르게 한다. 누른 것은 반드시 열린다.
        */}
        <details className="shop-fold">
          <summary>
            <i className="shop-arrow" aria-hidden="true" />
            <span className="shop-fold-ico" aria-hidden="true">
              <Icon name="search" size={15} />
            </span>
            {mallLabels[mall]}에서 {Math.min(cart.length, MAX_BULK_OPEN)}개 한 번에 열기
          </summary>

          <div className="shop-fold-body">
            {/* 너무 많이 열면 브라우저가 버거워서 도메인이 정한 수까지만 보여 준다 */}
            <ul className="shop-links">
              {cart.slice(0, MAX_BULK_OPEN).map((i) => (
                <li key={i.name}>
                  <a href={searchUrl(mall, i.name)} target="_blank" rel="noreferrer noopener">
                    {i.name}
                  </a>
                </li>
              ))}
            </ul>

            {/* 잘려 나간 것이 있으면 말없이 감추지 않고 밝혀 둔다 */}
            {cart.length > MAX_BULK_OPEN && (
              <p className="shop-note">
                나머지 {cart.length - MAX_BULK_OPEN}개는 위 목록에서 하나씩 눌러 주세요.
                한 번에 너무 많이 열면 브라우저가 막습니다.
              </p>
            )}
          </div>
        </details>

        {/* 목록을 글자로 옮겨 가는 자리 */}
        <details className="shop-fold">
          <summary>
            <i className="shop-arrow" aria-hidden="true" />
            <span className="shop-fold-ico" aria-hidden="true">
              <Icon name="book" size={15} />
            </span>
            {shopCopy.copyLabel}
          </summary>

          <div className="shop-fold-body">
            {/* 클립보드가 막혀 있어도 여기서 직접 긁어 갈 수 있다 */}
            <pre className="shop-pre">{shoppingListText([...cart])}</pre>

            <button className="btn btn-line btn-sm" type="button" onClick={copyList}>
              {copied ? "복사했습니다" : "클립보드로 복사"}
            </button>
          </div>
        </details>

        {/* 이 화면에서 진짜 해야 할 일 */}
        <button
          className="btn btn-fill shop-start"
          type="button"
          onClick={() => router.push("/cook")}
        >
          <span aria-hidden="true">🔥</span>
          {shopCopy.start}
        </button>
      </div>

      {/* ---------- 오른쪽: 출처와 전체 순서 ---------- */}
      <aside className="shop-side">
        <h2 className="shop-h2">
          <span className="shop-h2-ico" aria-hidden="true">
            <Icon name="book" size={17} />
          </span>
          {shopCopy.sourceLabel}
        </h2>

        {/* 어디서 온 레시피인지. 지어내지 않고 도메인이 담아 둔 값을 그대로 쓴다.
            유튜브만 한 줄이 아니라 카드로 크게 보여 준다 — 남의 영상에서 옮겨 온 것이라
            "무엇에서" 왔는지가 한눈에 보여야 하고, 우리가 만든 레시피와 헷갈리면 안 된다 */}
        {recipe.source.kind === "youtube" ? (
          <YoutubeSource source={recipe.source} />
        ) : (
          <p className="shop-source">
            {recipe.source.kind === "shelf"
              ? shopCopy.sourceShelf
              : recipe.source.kind === "community"
                ? // 커뮤니티 글에서 가져온 것이면 적은 사람을 밝힌다
                  `${shopCopy.sourceCommunity} · ${recipe.source.chef}`
                : shopCopy.sourceAi}
          </p>
        )}

        <h2 className="shop-h2 shop-h2-gap">
          <span className="shop-h2-ico" aria-hidden="true">
            <Icon name="timer" size={17} />
          </span>
          {shopCopy.stepsLabel}
        </h2>

        {/* 요리 화면과 같은 것을 쓴다 */}
        <RecipeSteps steps={recipe.steps} />

        {/* 앞 화면으로 돌아가는 길 */}
        <Link className="btn btn-line shop-back" href="/pick">
          {shopCopy.back}
        </Link>
      </aside>
    </div>
  );
}
