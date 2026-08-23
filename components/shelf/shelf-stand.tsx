"use client";

/**
 * 내 서재 — 가판대에 잡지를 세워 진열한 모습.
 *
 * 전에는 책등(세로로 선 얇은 막대)만 늘어놓았다. 서가에 꽂힌 모습이라
 * 그럴듯하긴 했지만 **무엇이 있는지 안 보였다.** 요리 이름을 세로로 읽어야 했고,
 * 표지에 적힌 인분·단계 같은 것은 아예 자리가 없었다.
 *
 * 그래서 표지를 앞으로 돌려 세웠다. 서가가 아니라 **가판대**다 —
 * 잡지 가게에서 표지를 보고 집어 드는 그 배치다. 고르는 자리에서는
 * 몇 권 있는지보다 무엇이 있는지가 먼저다.
 *
 * 표지 그림은 파일로 저장해 두지 않는다. 책마다 색조 하나만 담아 두고
 * 나머지는 여기서 그린다 — 요리 완성 화면이 그리는 레시피 카드와 같은 색을 쓴다.
 */

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { browserRecipeShelfStore } from "@/lib/adapter/browser-recipe-shelf-store";
import type { ShelfBook } from "@/lib/domain/recipe-shelf";
import { readRecipe, type Recipe } from "@/lib/domain/recipe";
import {
  findShelfBooks,
  unshelveBook,
  watchShelf,
} from "@/lib/usecase/keep-recipe-shelf";
import { coverToneLabels, coverTones, type CoverTone } from "@/lib/cook-content";
import { shelfCopy } from "@/lib/shelf-content";

/** 표지에 쓸 색조. 담아 둔 값이 이상하면 차례대로 돌려 가며 준다 */
const TONES = coverTones;

/** 출처를 부르는 말. 표지 밑에 한 줄로 붙는다 */
const SOURCE_LABELS = {
  ai: "쿡파일럿",
  youtube: "영상",
  shelf: "서재",
  community: "커뮤니티",
} as const;

/** 저장한 날. "2026-08-23" 그대로 쓴다 — 앞 열 자리가 곧 날짜다 */
// [F1][함수] shortDate(iso): 저장한 날을 'YYYY-MM-DD' 로 자른다
// 입력: iso 글자 → 처리: 앞 열 자리만 → 출력: 문자열 (Date 로 바꾸면 하루가 밀린다)
function shortDate(iso: string): string {
  /* Date 로 바꾸지 않는 까닭 — 시간대에 따라 하루가 밀린다.
     담을 때 이미 ISO 로 적어 두었으므로 잘라 쓰면 그만이다 */
  return iso.slice(0, 10);
}

// [F2][함수] ShelfStand(): 가판대에 잡지처럼 세운 내 서재
// 입력: 없음(브라우저 저장소) → 처리: 책마다 표지·정보·펼치기·빼기 → 출력: 화면(JSX)
export function ShelfStand() {
  const router = useRouter();

  /* 꽂혀 있는 책들. 브라우저에 담겨 있어서 "바깥 값 지켜보기" 로 따라간다 */
  // [F3][함수] watch(fn): 서재가 바뀌는지 지켜보라고 부탁하는 함수
  const watch = useCallback(
    (fn: () => void) => watchShelf(browserRecipeShelfStore, fn),
    [],
  );
  // [F4][외부] ▷ useSyncExternalStore(watch, findShelfBooks) → books
  const books = useSyncExternalStore(
    watch,
    () => findShelfBooks(browserRecipeShelfStore),
    // 서버에는 저장 공간이 없으니 늘 빈 서재로 본다
    () => EMPTY,
  );

  /* 지금 펼쳐 둔 책. 하나만 펼친다 — 여럿을 펼치면 가판대가 세로로 길어져서
     무엇을 보고 있었는지 잃어버린다 */
  // [F5][흐름] 지금 펼쳐 둔 책 번호 → open (하나만 펼친다)
  const [open, setOpen] = useState<string | null>(null);

  /** 책을 꺼내 그 레시피로 다시 요리하러 간다 */
  // [F6][함수] cookAgain(recipe): 책을 꺼내 그 레시피로 다시 요리하러 간다
  // 입력: recipe → 처리: 출처를 'shelf' 로 바꿔 담고 이동 → 출력: 없음
  function cookAgain(recipe: Recipe) {
    try {
      /* 출처를 서재로 바꿔 담는다. 장보기 화면이 "서재에서 꺼낸 레시피입니다"
         라고 밝힐 수 있어야 한다 */
      // [F7][외부] recipe ▷ browserRecipeDraftStore.save() → localStorage → router.push('/shop')
      browserRecipeDraftStore.save({ ...recipe, source: { kind: "shelf" } });
    } catch {
      // 담지 못했어도 화면은 넘어간다. 장보기가 "정해 둔 요리 없음" 으로 받아 준다
    }

    router.push("/shop");
  }

  /** 책 한 권을 뺀다 */
  // [F8][함수] drop(book): 책 한 권을 서재에서 뺀다
  // 입력: book → 처리: confirm 후 unshelveBook(usecase:F12) → 출력: 없음
  function drop(book: ShelfBook) {
    /* 되돌릴 수 없는 일이라 한 번 더 물어본다. 표지가 작아서 잘못 누르기 쉽다 */
    // [F9][분기] confirm 에서 '아니오' → 아무것도 안 함 / '예' → F10
    const sure = window.confirm(`"${book.title}" 을(를) 서재에서 뺍니다. 계속할까요?`);

    if (!sure) return;

    // [F10][호출] book.id ▷ unshelveBook(usecase:F12) → localStorage 갈아 끼움 → F4 가 다시 그린다
    unshelveBook(book.id, browserRecipeShelfStore);

    // 펼쳐 둔 것이 방금 지운 책이면 접는다
    setOpen((now) => (now === book.id ? null : now));
  }

  // 한 권도 없으면 빈 가판대 대신 무엇을 하라고 알려 준다
  // [F11][분기] 한 권도 없음 → true: 빈 가판대 대신 '요리 고르러 가기' 를 그리고 끝낸다
  if (books.length === 0) {
    return (
      <div className="sf-empty">
        <p className="sf-empty-t">{shelfCopy.emptyTitle}</p>
        <p className="sf-empty-s">{shelfCopy.emptyLead}</p>
        <Link className="btn btn-fill" href="/pick">
          {shelfCopy.emptyGo}
        </Link>
      </div>
    );
  }

  return (
    <div className="sf">
      {/* 몇 권인지와 무엇을 하면 되는지. 가판대 위에 한 줄 */}
      <p className="sf-count">
        {shelfCopy.countPrefix} {books.length}
        {shelfCopy.countSuffix}
      </p>

      <div className="sf-stand">
        <ul className="sf-rack">
          {books.map((book, i) => {
            // 담아 둔 색조가 이상하면 차례대로 돌려 가며 준다. 다 같은 색이면 안 예쁘다
            const tone = (
              TONES.includes(book.cover as CoverTone) ? book.cover : TONES[i % TONES.length]
            ) as CoverTone;

            // 레시피가 통째로 담긴 책만 다시 꺼낼 수 있다
            const read = readRecipe(book.recipe, book.servings ?? 2);
            const recipe = read.ok ? read.recipe : null;

            const opened = open === book.id;

            return (
              <li className="sf-slot" key={book.id}>
                {/* ---------- 표지 ---------- */}
                <button
                  className="sf-cover"
                  type="button"
                  // 색은 CSS 가 이 이름표를 보고 고른다. 레시피 카드와 같은 팔레트다
                  data-tone={tone}
                  onClick={() => (recipe ? cookAgain(recipe) : undefined)}
                  disabled={!recipe}
                  title={recipe ? shelfCopy.cookAgain : shelfCopy.tooOld}
                >
                  {/* 잡지 이름표. 표지 맨 위에 글자 사이를 벌려 얹는다 */}
                  <span className="sf-cover-brand">COOKPILOT</span>

                  {/* 냄비 그림. 표지에 사진이 없으니 이것이 그림 몫을 한다 */}
                  <span className="sf-cover-pot" aria-hidden="true">
                    <Icon name="flame" size={30} />
                  </span>

                  <span className="sf-cover-title">{book.title}</span>

                  <span className="sf-cover-serv">
                    {book.servings ? `${book.servings}인분` : ""}
                    {book.servings && recipe ? " · " : ""}
                    {recipe ? `${recipe.steps.length}단계` : ""}
                  </span>

                  {/* 아래쪽 띠. 진짜 잡지 표지의 바코드 자리쯤이다 */}
                  <span className="sf-cover-band" aria-hidden="true">
                    {coverToneLabels[tone]}
                  </span>
                </button>

                {/* ---------- 표지 밑 정보 ---------- */}
                <p className="sf-name">{book.title}</p>

                <p className="sf-meta">
                  {shortDate(book.savedAt)}
                  {recipe && (
                    <>
                      <span aria-hidden="true"> · </span>
                      {SOURCE_LABELS[recipe.source.kind]}
                      <span aria-hidden="true"> · </span>
                      {recipe.steps.length}단계
                    </>
                  )}
                </p>

                {/* 유튜브에서 옮겨 온 것이면 원작자를 여기서도 밝힌다.
                    표지만 보고 우리 레시피로 여기면 안 된다 */}
                {recipe?.source.kind === "youtube" && (
                  <p className="sf-with">{recipe.source.channel}</p>
                )}

                <div className="sf-acts">
                  <button
                    className="btn btn-line btn-sm sf-open"
                    type="button"
                    onClick={() => setOpen(opened ? null : book.id)}
                    disabled={!recipe}
                    aria-expanded={opened}
                  >
                    {opened ? shelfCopy.fold : shelfCopy.unfold}
                  </button>

                  <button
                    className="sf-drop"
                    type="button"
                    onClick={() => drop(book)}
                    aria-label={`${book.title} 서재에서 빼기`}
                    title={shelfCopy.drop}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>

                {/* 펼쳤을 때만 나오는 속. 재료와 순서를 그대로 보여 준다 */}
                {opened && recipe && (
                  <div className="sf-inside">
                    <p className="sf-inside-h">{shelfCopy.ingredients}</p>
                    <ul className="sf-ings">
                      {recipe.ingredients.map((ing) => (
                        <li key={ing.name}>
                          <span>{ing.name}</span>
                          <span className="sf-amount">{ing.amount}</span>
                        </li>
                      ))}
                    </ul>

                    <p className="sf-inside-h">{shelfCopy.steps}</p>
                    <ol className="sf-steps">
                      {recipe.steps.map((st, k) => (
                        // 같은 문장이 두 번 나올 수 있어서 차례를 이름표로 쓴다
                        <li key={k}>
                          {st.text}
                          {st.minutes ? <span className="sf-min">{st.minutes}분</span> : null}
                        </li>
                      ))}
                    </ol>

                    <button
                      className="btn btn-fill btn-sm sf-cook"
                      type="button"
                      onClick={() => cookAgain(recipe)}
                    >
                      <Icon name="flame" size={15} /> {shelfCopy.cookAgain}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* 잡지가 놓인 판. 그림일 뿐이라 읽어 주는 기계에는 숨긴다 */}
        <div className="sf-plank" aria-hidden="true" />
      </div>

      <p className="sf-hint">
        <Icon name="book" size={14} />
        {shelfCopy.hint}
      </p>
    </div>
  );
}

/**
 * 서버에서 그릴 때 돌려주는 빈 서재.
 *
 * `[]` 를 그때그때 만들면 React 가 "바뀌었다" 고 보고 끝없이 다시 그린다.
 */
const EMPTY: readonly ShelfBook[] = Object.freeze([]);
