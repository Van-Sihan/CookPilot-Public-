/**
 * 도메인 · 만든 요리를 글 초안으로 옮기는 규칙.
 *
 * 요리를 끝낸 사람에게 빈 종이를 주면 대부분 안 쓴다. 무엇을 만들었는지는
 * 이미 우리가 알고 있으니, **그것만큼은 채워 두고** 하고 싶은 말만 보태게 한다.
 *
 * 이 파일이 하는 일은 "레시피 한 편 → 글 초안 한 장" 하나뿐이다.
 * 어디에 담는지도, 화면이 어떻게 생겼는지도 모른다.
 */

import type { PostDraft, PostTone } from "@/lib/domain/post-draft";
import type { Recipe } from "@/lib/domain/recipe";

/**
 * 걸리는 시간을 다 더한다. 카드의 "45분" 자리에 들어간다.
 *
 * 시간이 하나도 안 적힌 레시피면 null 이다 — 0분이라고 적으면 거짓말이 된다.
 */
// [F1][함수] totalMinutes(recipe): 걸음마다 적힌 시간을 다 더한다
// 입력: recipe → 처리: steps.minutes 합계 → 출력: 분(숫자) 또는 null (F7 이 부른다)
function totalMinutes(recipe: Recipe): number | null {
  // [F2][반복] recipe.steps 전체를 훑어 minutes 를 sum 에 누적
  const sum = recipe.steps.reduce((n, s) => n + (s.minutes ?? 0), 0);

  // [F3][반환] sum > 0 이면 sum, 아니면 null → F7 의 minutes 칸으로
  return sum > 0 ? sum : null;
}

/**
 * 딱지를 짐작한다.
 *
 * 사람이 고르게 두어도 되지만, 대부분은 기본값을 그대로 둔다. 그러면
 * 모든 글에 같은 딱지가 붙어 목록에서 갈래가 안 보인다. 그래서 요리 이름을
 * 보고 그럴듯한 것을 미리 골라 둔다 — 마음에 안 들면 고치면 된다.
 */
// [F4][함수] guessBadge(title): 요리 이름을 보고 카테고리(태그)를 짚는다
// 입력: title → 처리: rules 를 위에서부터 정규식 대조 → 출력: 태그 문자열 (F7 이 부른다)
function guessBadge(title: string): string {
  const rules: readonly [RegExp, string][] = [
    [/파스타|스파게티|리조또|피자/, "파스타"],
    [/케이크|쿠키|초콜릿|디저트|빵|크로플|약과|타르트/, "디저트"],
    [/찜|무침|볶음|조림|나물|반찬/, "밑반찬"],
    [/국수|라면|우동|막국수|소바|비빔밥|덮밥|카레|한 그릇/, "한 그릇"],
    [/떡볶이|튀김|치킨|야식|마라/, "야식"],
    [/스테이크|삼겹|갈비|불고기|구이/, "메인"],
  ];

  // [F5][반복] rules 를 위에서부터 훑다가 처음 걸리는 것에서 멈춘다
  // [F5][분기] pattern.test(title) → true: 그 badge 반환 / false: 다음 규칙
  for (const [pattern, badge] of rules) {
    if (pattern.test(title)) return badge;
  }

  // 못 짚으면 가장 넓은 갈래로 둔다
  // [F6][반환] 하나도 안 걸리면 '한 그릇' → F7 의 badge 칸으로
  return "한 그릇";
}

/**
 * 재료와 순서를 사람이 읽을 글로 편다.
 *
 * 본문에 이걸 미리 넣어 두는 까닭 — 글을 쓰는 사람은 "어떻게 만들었나" 를
 * 다시 적기 싫어한다. 이미 적혀 있으면 그 아래에 느낌만 보태게 된다.
 */
// [F7-pre][함수] bodyFrom(recipe): 재료·순서를 사람이 읽을 본문으로 편다
// 입력: recipe → 처리: ingredients·steps 를 줄 목록으로 → 출력: 본문 문자열 (F7 이 부른다)
function bodyFrom(recipe: Recipe): string {
  const ingredients = recipe.ingredients
    .map((i) => `- ${i.name} ${i.amount}`)
    .join("\n");

  const steps = recipe.steps
    .map((s, i) => `${i + 1}. ${s.text}${s.minutes ? ` (${s.minutes}분)` : ""}`)
    .join("\n");

  return [
    `${recipe.servings}인분으로 만들었습니다.`,
    "",
    "재료",
    ingredients,
    "",
    "만드는 순서",
    steps,
    "",
    "— 여기부터 하고 싶은 말을 적어 주세요 —",
  ].join("\n");
}

/** 만든 요리를 글 초안으로 옮긴다 */
// [F7][함수] draftFromRecipe(recipe, tone): 만든 요리를 글 초안으로 옮긴다
// 입력: recipe + tone → 처리: bodyFrom·guessBadge·totalMinutes 호출 → 출력: PostDraft
// [F7][호출] recipe → bodyFrom(F7-pre) / guessBadge(F4) / totalMinutes(F1)
// [F7][반환] PostDraft → write-form.tsx 가 각 입력칸에 채운다
export function draftFromRecipe(recipe: Recipe, tone: PostTone): PostDraft {
  return {
    title: recipe.title,
    /* 요약은 비워 둔다. 여기까지 지어내면 사람이 쓴 글이 아니라
       기계가 쓴 글이 된다 — 목록에서 눈에 띄는 자리라 더 그렇다 */
    summary: "",
    body: bodyFrom(recipe),
    badge: guessBadge(recipe.title),
    minutes: totalMinutes(recipe),
    // 사람이 쓰는 글이라 늘 보통 갈래다. 브랜드 글은 브랜드 계정만 쓴다
    kind: "community",
    tone,
    // 그림은 화면이 표지를 그려 올린 뒤에 채운다
    imageUrl: null,
  };
}
