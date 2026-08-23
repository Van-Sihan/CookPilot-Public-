import "server-only";

/**
 * 어댑터 · samples/reviews.csv 를 읽어 후기 목록으로 바꾼다.
 *
 * 교재가 시킨 대로 랭체인의 CSVLoader 로 읽는다. 다만 한 가지 손이 더 간다.
 *
 * CSVLoader 는 한 줄을 문서 하나로 만들면서 pageContent 에
 * `id: r001\ndish: 계란찜\n…` 처럼 **칸 이름과 값을 이어 붙인 글자**를 넣는다.
 * metadata 에는 파일 이름과 줄 번호만 담기고 칸 값은 안 담긴다.
 * 그래서 그대로 쓰면 답에 "어느 요리 후기인가" 를 붙일 수 없다.
 *
 * 그래서 붙여 놓은 글자를 다시 칸으로 풀어 낸다. 값 안에 줄바꿈이 있으면
 * 이 방식이 깨지는데, 우리 CSV 는 후기 한 건이 한 줄이라 그럴 일이 없다.
 * 그래도 깨진 줄은 도메인이 걸러 내므로 조용히 이상한 값이 올라가진 않는다.
 */

import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import path from "node:path";
import { readReviewRow, type Review } from "@/lib/domain/review";

/** 후기 파일이 있는 자리. 프로젝트 뿌리에서부터 찾는다 */
const CSV_PATH = path.join(process.cwd(), "samples", "reviews.csv");

/**
 * `id: r001` 같은 줄들을 다시 칸으로 푼다.
 *
 * 첫 번째 콜론에서만 자른다. 후기 내용에 콜론이 들어 있어도(예: "비율: 2 대 1")
 * 뒤쪽은 값으로 남는다.
 */
function unflatten(pageContent: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const line of pageContent.split("\n")) {
    const at = line.indexOf(":");

    // 콜론이 없는 줄은 앞줄 값이 이어진 것이다. 우리 CSV 에는 없어야 한다
    if (at <= 0) continue;

    out[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }

  return out;
}

/** 읽은 결과. 몇 줄을 버렸는지 함께 알려 준다 */
export type LoadResult = {
  reviews: readonly Review[];
  /** 모양이 어긋나 버린 줄 수. 0이 아니면 CSV 를 봐야 한다 */
  skipped: number;
};

/** CSV 를 읽어 후기 목록으로 바꾼다 */
export async function loadReviews(): Promise<LoadResult> {
  const docs = await new CSVLoader(CSV_PATH).load();

  const reviews: Review[] = [];
  let skipped = 0;

  for (const doc of docs) {
    // 칸으로 푼 다음 도메인에게 "받아 줄 만한가" 를 묻는다
    const review = readReviewRow(unflatten(doc.pageContent));

    if (review) reviews.push(review);
    else skipped += 1;
  }

  return { reviews, skipped };
}
