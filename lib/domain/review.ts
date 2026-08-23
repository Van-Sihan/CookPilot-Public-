/**
 * 도메인 · 요리 후기 한 건.
 *
 * 챗봇이 뒤져 볼 자료다. 교재의 "쇼핑 리뷰" 자리에 우리 요리 후기가 들어간다.
 * 칸 이름은 samples/reviews.csv 와 수파베이스 `reviews` 표에 그대로 맞춰 두었다 —
 * 세 군데 이름이 다르면 옮겨 적는 코드가 두 벌 생긴다.
 *
 * 이 파일은 후기가 어떻게 생겼는지와, CSV 한 줄을 어떻게 읽을지만 안다.
 * 파인콘도 랭체인도 수파베이스도 모른다.
 */

/** 후기 한 건 */
export type Review = {
  /** 후기마다 겹치지 않는 이름. 다시 올릴 때 같은 자리를 덮어쓰려고 쓴다 */
  id: string;
  /** 어느 요리 글의 후기인지. 커뮤니티 글 id 와 짝을 이룬다 */
  dishId: string;
  /** 요리 이름 */
  dish: string;
  /** 별점 1~5 */
  rating: number;
  /** 한 줄 제목 */
  title: string;
  /** 내용 */
  content: string;
  /** 쓴 사람의 닉네임 */
  author: string;
  /** 언제 썼는지. "2026-08-10" 모양의 글자 */
  date: string;
  /** 도움이 됐다고 누른 수 */
  helpfulVotes: number;
  /** 실제로 만들어 보고 쓴 후기인지 */
  verifiedCook: boolean;
};

/** 별점의 아래위 */
export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** 값 하나를 글자로 받아 준다. 없으면 빈 글자 */
function asText(value: unknown): string {
  if (typeof value === "number") return String(value);

  return typeof value === "string" ? value.trim() : "";
}

/** 값 하나를 숫자로 받아 준다. 못 읽으면 준 기본값 */
function asNumber(value: unknown, fallback: number): number {
  const n = typeof value === "string" ? Number(value) : value;

  return typeof n === "number" && Number.isFinite(n) ? n : fallback;
}

/**
 * CSV 한 줄을 후기로 받아 준다. 모양이 어긋나면 null.
 *
 * 왜 이런 게 필요한가. CSV 는 사람이 손으로 고치는 파일이다. 칸을 하나 지우거나
 * 별점 자리에 글자를 적어 넣기 쉽다. 그대로 파인콘에 올리면 검색 결과에
 * 빈 후기가 섞여 나오는데, 그때는 어디서 잘못됐는지 찾기 어렵다.
 * 여기서 걸러 내면 "몇 줄이 버려졌다" 를 올리는 자리에서 셀 수 있다.
 */
export function readReviewRow(row: Record<string, unknown>): Review | null {
  const id = asText(row.id);
  const content = asText(row.content);

  // id 가 없으면 덮어쓸 자리를 정할 수 없고, 내용이 없으면 검색될 것이 없다
  if (id.length === 0 || content.length === 0) return null;

  const dish = asText(row.dish);

  // 요리 이름이 없으면 답에 출처를 못 붙인다. 근거 없는 답이 되므로 버린다
  if (dish.length === 0) return null;

  return {
    id,
    dishId: asText(row.dish_id),
    dish,
    // 별점이 빠지거나 이상하면 가운데 값으로 본다. 이 값 때문에 줄을 버릴 것은 아니다
    rating: clampRating(asNumber(row.rating, 3)),
    title: asText(row.title),
    content,
    author: asText(row.author) || "익명",
    date: asText(row.date),
    // 도움 수는 없으면 0. 없다고 후기가 못 쓸 것이 되지는 않는다
    helpfulVotes: Math.max(0, Math.round(asNumber(row.helpful_votes, 0))),
    // CSV 에는 "true"/"false" 라는 **글자**로 들어 있다. 글자 "false" 는 참이라 주의
    verifiedCook: asText(row.verified_cook).toLowerCase() === "true",
  };
}

/** 별점을 1~5 안으로 밀어 넣는다 */
export function clampRating(n: number): number {
  return Math.min(MAX_RATING, Math.max(MIN_RATING, Math.round(n)));
}

/**
 * 후기 하나를 **검색에 걸릴 글자**로 편다.
 *
 * 내용만 넣지 않는 까닭이 셋이다.
 *
 *  1. 요리 이름을 넣어야 "까르보나라 후기 보여 줘" 같은 물음이 걸린다.
 *     내용에는 요리 이름이 안 나오는 후기가 대부분이다.
 *  2. 별점을 글자로 적어 두면 "별로였다는 후기 있어?" 같은 물음이 걸린다.
 *     숫자 5 보다 "별점 5점" 이 훨씬 잘 걸린다.
 *  3. 제목이 대개 후기의 요점이다. 짧고 세서 검색에 잘 걸린다.
 *
 * 여기서 만든 글자가 그대로 벡터가 된다. 이 함수가 이 챗봇의 검색 품질을
 * 절반쯤 쥐고 있다.
 */
export function reviewText(review: Review): string {
  return [
    `요리: ${review.dish}`,
    `별점: ${review.rating}점`,
    `제목: ${review.title}`,
    `후기: ${review.content}`,
    // 만들어 보고 쓴 후기인지는 무게가 다르다. 모델이 그걸 알아야 한다
    review.verifiedCook ? "실제로 만들어 보고 쓴 후기" : "만들어 보지 않고 쓴 후기",
  ].join("\n");
}
