/**
 * 도메인 · 글 한 편의 속.
 *
 * 목록 카드가 아는 것(제목·좋아요·색조)은 [[site-content]] 의 CommunityPost 가 쥔다.
 * 이 파일은 그 글을 **열고 들어갔을 때** 나오는 것들을 다룬다 —
 * 본문, 레시피, 사진 출처, 댓글.
 *
 * 둘을 한 덩어리로 묶지 않은 까닭이 있다. 목록 화면은 열여섯 편을 한꺼번에 그리는데,
 * 본문과 댓글까지 딸려 오면 안 쓸 글자를 잔뜩 실어 보내게 된다.
 *
 * 여기에는 import 가 딱 하나, 레시피뿐이다. 커뮤니티 글에 붙는 레시피와
 * AI 가 만들어 주는 레시피가 같은 모양이라야 "이 레시피로 요리 시작" 이 성립한다.
 */

import type { Recipe } from "@/lib/domain/recipe";

/**
 * 사진 한 장의 출처.
 *
 * 남이 찍은 사진을 쓰는 이상 누가 찍었고 어떤 허락 아래 쓰는지를 같이 적어야 한다.
 * 적을 자리를 도메인에 만들어 두면 화면이 이걸 빠뜨리기 어려워진다 —
 * 타입이 비어 있는 것을 허락하지 않기 때문이다.
 */
export type PhotoCredit = {
  /** 찍은 사람 */
  by: string;
  /** 어떤 허락인지. "CC BY-SA 4.0" 처럼 이름을 그대로 적는다 */
  license: string;
  /** 그 허락문이 있는 곳 */
  licenseUrl: string;
  /** 사진이 올라와 있는 원래 자리 */
  page: string;
};

/** 본문 한 토막. 소제목 하나에 문단 몇 개가 딸린다 */
export type PostSection = {
  /** 소제목 */
  heading: string;
  /** 그 아래 문단들 */
  paragraphs: readonly string[];
};

/** 글 밑에 달린 댓글 하나 */
export type PostComment = {
  /** 목록에서 서로를 구별할 이름. 겹치면 안 된다 */
  id: string;
  /** 쓴 사람의 닉네임 */
  who: string;
  /** 언제 썼는지. 화면에 그대로 나가는 글자다 — 아래 형 정의를 보라 */
  when: string;
  /** 내용 */
  text: string;
};

/**
 * 열고 들어갔을 때 보이는 것들.
 *
 * id 는 목록의 CommunityPost 와 같은 값을 쓴다. 그래야 카드에서 이리로 이어진다.
 */
export type PostDetail = {
  /** 어느 글인지. CommunityPost.id 와 짝을 이룬다 */
  id: string;
  /** 올린 날. "2026년 8월 14일" 처럼 이미 사람이 읽을 모양으로 적는다 */
  published: string;
  /** 큰 사진에 붙는 설명. 눈이 안 보이는 사람에게는 이 글이 사진을 대신한다 */
  alt: string;
  /** 그 사진을 누가 찍었는지 */
  credit: PhotoCredit;
  /** 제목 바로 밑에 굵게 놓이는 몇 줄 */
  intro: string;
  /** 소제목이 붙은 본문 */
  sections: readonly PostSection[];
  /** 글에 달린 꼬리표 */
  tags: readonly string[];
  /** 이 글이 알려 주는 레시피. 요리 화면이 그대로 받아 쓸 수 있는 모양이다 */
  recipe: Recipe;
  /** 미리 달려 있는 댓글. 내가 쓴 것은 여기에 없고 브라우저에 따로 쌓인다 */
  comments: readonly PostComment[];
};

/**
 * 그 글의 사진이 놓인 자리.
 *
 * 글 id 와 파일 이름을 맞춰 두어서 규칙 하나로 찾아진다. 글마다 경로를 따로
 * 적어 두면 id 를 고칠 때 한쪽만 고치고 지나치기 쉽다.
 *
 * 목록 카드와 자세히 보기가 같이 쓴다. 그래서 본문이 담긴 파일이 아니라
 * 여기 둔다 — 카드만 그리는 화면이 본문 열여섯 편을 끌고 올 이유가 없다.
 */
// [F1][함수] photoPath(postId): 예시 글의 사진 파일 경로를 규칙으로 만든다
// 입력: postId → 처리: '/food/<id>.jpg' 로 조립 → 출력: 경로 문자열
// [F1][반환] 경로 → community/page.tsx 가 카드에, post-article 이 큰 사진에 쓴다
export function photoPath(postId: string): string {
  return `/food/${postId}.jpg`;
}

/** 댓글로 받아 줄 수 있는 가장 짧은 길이. 한 글자짜리는 실수로 눌린 것에 가깝다 */
export const MIN_COMMENT = 2;

/**
 * 가장 긴 길이.
 *
 * 위를 막아 두는 까닭은 예의가 아니라 저장소다. 브라우저에 담아 두는데
 * 한 사람이 십만 자를 붙여넣으면 저장 공간이 차서 **다른 값까지** 못 담게 된다.
 */
export const MAX_COMMENT = 500;

/** 댓글을 못 받아 준 까닭. 무슨 말로 보여 줄지는 화면이 정한다 */
export type CommentProblem = "empty" | "short" | "long";

/** 댓글을 살펴본 결과 */
export type CommentRead =
  | { ok: true; text: string }
  | { ok: false; problem: CommentProblem };

/**
 * 쓴 댓글을 받아 줄지 살펴본다.
 *
 * 앞뒤 빈칸을 떼고 나서 길이를 잰다. 공백만 잔뜩 넣은 것을 "500자 썼다" 로
 * 세면 빈 댓글이 그대로 올라간다.
 */
// [F2][함수] checkComment(raw): 댓글을 받아 줄지 판정
// 입력: raw(댓글 입력칸 글자) → 처리: trim 후 길이 검사 → 출력: CommentRead
export function checkComment(raw: string): CommentRead {
  // 줄바꿈까지 포함해 앞뒤 여백을 걷어 낸다
  // [F3][흐름] raw → trim() → text
  const text = raw.trim();

  // 아무것도 안 썼으면 짧다고 나무랄 일이 아니라 그냥 안 쓴 것이다
  // [F4][분기] 길이 0 → 'empty' / 2 미만 → 'short' / 500 초과 → 'long' / 아니면 F5
  if (text.length === 0) return { ok: false, problem: "empty" };

  // 한 글자는 손이 미끄러진 쪽에 가깝다
  if (text.length < MIN_COMMENT) return { ok: false, problem: "short" };

  // 위를 넘으면 잘라 내지 않고 돌려보낸다. 말없이 자르면 뒷말이 사라진 줄 모른다
  if (text.length > MAX_COMMENT) return { ok: false, problem: "long" };

  // 다듬은 글자를 돌려준다. 화면은 원본이 아니라 이 값을 담아야 한다
  // [F5][반환] text → sayOnPost(브라우저) · writeComment/reviseComment(표) 로 전달
  return { ok: true, text };
}

/**
 * id 로 글 한 편을 찾는다. 없으면 null.
 *
 * 주소창에 아무 글자나 적고 들어올 수 있어서 "못 찾음" 이 늘 있는 일이다.
 * 탭과 달리 여기서는 기본값으로 돌리지 않는다 — 없는 글을 다른 글로 바꿔
 * 보여 주면 사람은 자기가 누른 글을 읽고 있다고 잘못 안다.
 */
// [F6][함수] findPostDetail(all, id): 예시 글 열여섯 편 중 하나를 id 로 찾는다
// 입력: all(postDetails) + id → 처리: 배열 훑기 → 출력: PostDetail 또는 null
export function findPostDetail(
  all: readonly PostDetail[],
  id: string,
): PostDetail | null {
  // [F7][반복] all 을 앞에서부터 훑다가 id 가 같은 글을 만나면 멈춘다
  // [F7][반환] PostDetail 또는 null → app/posts/[id]/page.tsx 가 404 판정에 쓴다
  return all.find((p) => p.id === id) ?? null;
}
