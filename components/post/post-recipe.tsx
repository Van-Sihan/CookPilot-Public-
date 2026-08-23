/**
 * 글에 붙는 레시피 칸 — 재료와 순서.
 *
 * 장보기 화면의 [[recipe-steps]] 와 겹쳐 보이지만 하는 일이 다르다.
 * 저쪽은 요리하러 가는 사람이 보는 목록이고, 여기는 글을 읽는 사람이
 * "이거 만들 만한가" 를 재 보는 자리다. 그래서 재료에 체크칸이 없다.
 */

import { CookThis } from "@/components/post/cook-this";
import { Icon } from "@/components/icons";
import { splitMinutes, totalMinutes, type Recipe } from "@/lib/domain/recipe";
import { postCopy } from "@/lib/post-copy";

/**
 * 분을 사람이 읽을 글자로 바꾼다.
 *
 * 나누는 일은 도메인이 하고, 여기서는 부를 말만 붙인다.
 * 한 시간이 안 되면 "분" 만, 딱 떨어지면 "시간" 만 적는다 —
 * "3시간 0분" 은 틀리지 않았을 뿐 읽기 나쁘다.
 */
function timeText(minutes: number): string {
  const { hours, minutes: rest } = splitMinutes(minutes);

  if (hours === 0) return `${rest}${postCopy.minuteUnit}`;
  if (rest === 0) return `${hours}${postCopy.hourUnit}`;

  return `${hours}${postCopy.hourUnit} ${rest}${postCopy.minuteUnit}`;
}

export function PostRecipe({ recipe }: { recipe: Recipe }) {
  /* 걸음마다 적힌 시간을 다 더한 값. 재료 손질까지 포함한 어림이다.
     목록 카드의 "45분" 은 사람이 적은 값이고 이쪽은 계산한 값이라 다를 수 있다 */
  const total = totalMinutes(recipe);

  return (
    <aside className="pd-recipe">
      <h2 className="pd-rh">
        <span className="pd-rh-ico" aria-hidden="true">
          <Icon name="book" size={18} />
        </span>
        {postCopy.recipeLabel}
      </h2>

      {/* 몇 인분인지와 다 하면 얼마나 걸리는지. 만들지 말지 여기서 갈린다 */}
      <p className="pd-rfacts">
        <span>
          {recipe.servings}
          {postCopy.servingsUnit}
        </span>
        {/* 시간이 하나도 안 적힌 레시피면 이 칸을 아예 안 그린다 */}
        {total > 0 && (
          <span>
            {postCopy.aboutPrefix} {timeText(total)}
          </span>
        )}
      </p>

      <h3 className="pd-rsub">{postCopy.ingredientsLabel}</h3>

      <ul className="pd-ing">
        {recipe.ingredients.map((i) => (
          <li key={i.name}>
            <span className="pd-ing-n">
              {i.name}
              {/* 집에 늘 있는 것은 장 볼 때 안 사도 된다. 미리 알려 준다 */}
              {i.pantry && (
                <span className="pd-ing-p">{postCopy.pantryMark}</span>
              )}
            </span>
            <span className="pd-ing-a">{i.amount}</span>
          </li>
        ))}
      </ul>

      <h3 className="pd-rsub">{postCopy.stepsLabel}</h3>

      {/* ol 로 두면 번호를 CSS 가 아니라 브라우저가 매긴다. 순서가 뜻을 가진 목록이다 */}
      <ol className="pd-steps">
        {recipe.steps.map((s) => (
          <li key={s.text}>
            <span className="pd-step-t">{s.text}</span>
            {/* 시간이 적힌 걸음에만 붙인다. 하룻밤 두는 걸음은 "12시간" 으로 나온다 */}
            {s.minutes && <span className="pd-step-m">{timeText(s.minutes)}</span>}
          </li>
        ))}
      </ol>

      {/* 여기서만 브라우저가 움직인다 */}
      <CookThis recipe={recipe} />
    </aside>
  );
}
