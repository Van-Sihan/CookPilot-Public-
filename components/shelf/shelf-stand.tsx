"use client";

/**
 * 내 요리 서재 — 가판대에 책을 세워 진열한 모습.
 *
 * 목록으로 늘어놓지 않고 **책을 세워 두는** 까닭이 있다.
 * 서재는 "몇 개 저장했나" 를 세는 자리가 아니라 "무엇을 만들었나" 를 돌아보는
 * 자리다. 책등이 나란히 선 모습이 그 느낌을 만든다.
 *
 * 표지 그림은 없다. 책마다 색조 하나만 담아 두고 CSS 가 그린다 —
 * 요리 사진을 저장해 두지 않기 때문이다.
 */

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { browserRecipeDraftStore } from "@/lib/adapter/browser-recipe-draft-store";
import { browserRecipeShelfStore } from "@/lib/adapter/browser-recipe-shelf-store";
import type { ShelfBook } from "@/lib/domain/recipe-shelf";
import { readRecipe } from "@/lib/domain/recipe";
import { findShelfBooks, watchShelf } from "@/lib/usecase/keep-recipe-shelf";
import { shelfCopy } from "@/lib/shelf-content";
import { useRouter } from "next/navigation";

/** 책등에 쓸 색조. 담아 둔 값이 이상하면 첫 번째 것으로 돌린다 */
const TONES = ["ember", "herb", "cocoa", "cream"] as const;

/** 저장한 날을 짧게 적는다. "2026. 8. 23." 같은 긴 글자는 책등에 안 들어간다 */
function shortDate(iso: string): string {
  // ISO 글자 앞 열 자리가 곧 날짜다. Date 로 바꾸면 시간대 때문에 하루가 밀릴 수 있다
  const [year, month, day] = iso.slice(0, 10).split("-");

  return year && month && day ? `${Number(month)}.${Number(day)}` : "";
}

export function ShelfStand() {
  const router = useRouter();

  /* 꽂혀 있는 책들. 브라우저에 담겨 있어서 "바깥 값 지켜보기" 로 따라간다 */
  const watch = useCallback(
    (fn: () => void) => watchShelf(browserRecipeShelfStore, fn),
    [],
  );
  const books = useSyncExternalStore(
    watch,
    () => findShelfBooks(browserRecipeShelfStore),
    // 서버에는 저장 공간이 없으니 늘 빈 서재로 본다
    () => EMPTY,
  );

  /** 책을 꺼내 그 레시피로 다시 요리하러 간다 */
  function cookAgain(book: ShelfBook) {
    // 레시피를 통째로 담아 두지 않은 옛 책이면 꺼낼 것이 없다
    const read = readRecipe(book.recipe, book.servings ?? 2);

    if (!read.ok) return;

    try {
      /* 출처를 서재로 바꿔 담는다. 장보기 화면이 "서재에서 꺼낸 레시피입니다"
         라고 밝힐 수 있어야 한다 */
      browserRecipeDraftStore.save({ ...read.recipe, source: { kind: "shelf" } });
    } catch {
      // 담지 못했어도 화면은 넘어간다. 장보기가 "정해 둔 요리 없음" 으로 받아 준다
    }

    router.push("/shop");
  }

  // 한 권도 없으면 빈 가판대 대신 무엇을 하라고 알려 준다
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
      {/* 가판대 한 칸. 책이 늘면 아래로 줄이 늘어난다 */}
      <div className="sf-shelf">
        <ul className="sf-row">
          {books.map((book, i) => {
            // 담아 둔 색조가 이상하면 차례대로 돌려 가며 준다. 다 같은 색이면 안 예쁘다
            const tone = TONES.includes(book.cover as (typeof TONES)[number])
              ? book.cover
              : TONES[i % TONES.length];

            // 레시피가 통째로 담긴 책만 다시 꺼낼 수 있다
            const canCook = readRecipe(book.recipe, book.servings ?? 2).ok;

            return (
              <li className="sf-book" key={book.id}>
                <button
                  className={`sf-spine sf-spine-${tone}`}
                  type="button"
                  onClick={() => cookAgain(book)}
                  disabled={!canCook}
                  title={canCook ? shelfCopy.cookAgain : shelfCopy.tooOld}
                >
                  {/* 책등 위쪽의 작은 표시. 진짜 책의 띠지처럼 */}
                  <span className="sf-band" aria-hidden="true" />

                  {/* 책등에 세로로 적히는 요리 이름 */}
                  <span className="sf-title">{book.title}</span>

                  {/* 아래쪽에 인분과 날짜. 작게 */}
                  <span className="sf-foot">
                    {book.servings ? `${book.servings}인분` : ""}
                    <span className="sf-date">{shortDate(book.savedAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* 책들이 놓인 선반. 그림일 뿐이라 읽어 주는 기계에는 숨긴다 */}
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
