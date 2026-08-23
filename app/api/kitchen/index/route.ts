import { NextResponse } from "next/server";
import { loadReviews } from "@/lib/adapter/csv-reviews";
import { indexReviews, searchOnly } from "@/lib/adapter/langchain-rag";

/**
 * 자료 올리기 · 미리 보기.
 *
 * 교재의 "샘플 데이터 인덱싱" 단추가 부르는 자리다.
 * samples/reviews.csv → 랭체인 Document → 파인콘.
 *
 * 여러 번 눌러도 된다 — 같은 후기는 같은 id 로 덮어쓴다.
 *
 * 지금은 누구나 부를 수 있다. 자료가 우리가 쓴 예시 후기뿐이고 덮어쓰기만
 * 하기 때문인데, 남의 글이 들어오게 되면 **여기에 자물쇠를 달아야 한다** —
 * 안 그러면 아무나 우리 인덱스를 계속 다시 쓰게 만들 수 있다.
 */
export async function POST() {
  const { reviews, skipped } = await loadReviews();

  // 읽을 것이 하나도 없으면 다녀올 까닭이 없다
  if (reviews.length === 0) {
    return NextResponse.json({
      ok: false,
      reason: "setup",
      detail: "samples/reviews.csv 에서 읽어 낸 후기가 없습니다",
    });
  }

  const result = await indexReviews(reviews);

  /* 버린 줄이 있으면 성공했더라도 알려 준다. 조용히 넘어가면
     100건인 줄 알았던 자료가 실은 90건인 채로 굴러간다 */
  return NextResponse.json(result.ok ? { ...result, skipped } : result);
}

/**
 * GET — 올리지 않고 몇 건이 읽히는지만 본다.
 *
 * 파인콘 키가 없어도 부를 수 있다. CSV 를 고친 뒤 "몇 건이 되고 어떤 모양인가"
 * 를 확인하려고 둔다 — 올려 보고 나서야 이상한 걸 알면 인덱스를 이미 더럽힌 뒤다.
 */
export async function GET(request: Request) {
  /* `?q=계란찜` 을 붙이면 올리지 않고 검색만 해 본다.
     검색이 안 걸리는 것과 답이 이상한 것은 고칠 곳이 달라서, 갈라 볼 수 있어야 한다 */
  const q = new URL(request.url).searchParams.get("q");

  if (q) return NextResponse.json(await searchOnly(q));

  const { reviews, skipped } = await loadReviews();

  return NextResponse.json({
    count: reviews.length,
    // 모양이 어긋나 버린 줄. 0이 아니면 CSV 를 봐야 한다
    skipped,
    // 요리마다 몇 건씩인지. 한쪽에 몰리면 검색이 그쪽으로만 걸린다
    byDish: reviews.reduce<Record<string, number>>((acc, r) => {
      acc[r.dish] = (acc[r.dish] ?? 0) + 1;
      return acc;
    }, {}),
    // 눈으로 볼 수 있게 앞의 둘만
    sample: reviews.slice(0, 2),
  });
}
