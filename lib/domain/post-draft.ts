/**
 * 도메인 · 사람이 쓰는 글 한 편이 갖춰야 할 것.
 *
 * [[post]] 는 이미 올라와 있는 글을 다루고, 이 파일은 **쓰는 중인 글**을 다룬다.
 * 둘을 나눈 까닭 — 쓰는 중에는 없는 칸이 많다. 좋아요도, 올린 날짜도,
 * 글쓴이도 아직 없다. 그것들을 한 타입에 넣으면 "없어도 되는 칸" 이 늘어서
 * 다 올라온 글에서도 있는지 없는지 매번 확인해야 한다.
 *
 * 칸 이름은 수파베이스 `posts` 표에 그대로 맞춰 두었다.
 */

/** 글이 걸리는 갈래. 표의 check 와 같은 값이어야 한다 */
export type PostKind = "community" | "brand" | "trend";

/** 카드 색조. 사진이 없을 때 뒤에 깔린다 */
export type PostTone = "ember" | "herb" | "cocoa" | "cream";

/** 쓰는 중인 글 한 편 */
export type PostDraft = {
  /** 카드에 크게 나오는 제목 */
  title: string;
  /** 카드에 두세 줄 보이는 요약. 없어도 된다 */
  summary: string;
  /** 본문. 줄바꿈을 그대로 살려 보여 준다 */
  body: string;
  /** 그림 왼쪽 위에 붙는 분류 딱지 */
  badge: string;
  /** 걸리는 시간(분). 없으면 안 그린다 */
  minutes: number | null;
  /** 어느 갈래인지 */
  kind: PostKind;
  /** 카드 색조 */
  tone: PostTone;
  /** 붙일 그림 주소. 아직 안 올렸으면 null */
  imageUrl: string | null;
};

/* 표의 check 와 같은 값이어야 한다. 여기가 더 느슨하면 저장할 때
   데이터베이스가 거절하는데, 그때 나오는 말은 사람이 읽을 것이 못 된다 */
export const MAX_TITLE = 80;
export const MAX_SUMMARY = 300;
export const MAX_BADGE = 12;
export const MAX_BODY = 20_000;
export const MAX_MINUTES = 1440;

/** 본문을 이만큼은 써야 글이라고 할 수 있다 */
export const MIN_BODY = 10;

/** 글을 못 받아 준 까닭. 무슨 말로 보여 줄지는 화면이 정한다 */
export type DraftProblem =
  | "title-empty"
  | "title-long"
  | "summary-long"
  | "body-short"
  | "body-long"
  | "badge-empty"
  | "badge-long"
  | "minutes-range";

/** 글을 살펴본 결과 */
export type DraftRead =
  | { ok: true; draft: PostDraft }
  | { ok: false; problem: DraftProblem };

/** 갈래를 받아 준다. 모르는 값이면 보통 글로 본다 */
export function resolveKind(raw: unknown): PostKind {
  return raw === "brand" || raw === "trend" ? raw : "community";
}

/** 색조를 받아 준다. 모르는 값이면 첫 번째 것으로 */
export function resolveTone(raw: unknown): PostTone {
  return raw === "herb" || raw === "cocoa" || raw === "cream" ? raw : "ember";
}

/**
 * 폼에서 온 값을 글로 받아 줄지 살펴본다.
 *
 * 화면에서 이미 걸렀더라도 여기서 또 본다. 서버로 들어오는 입구는
 * 화면 말고도 있다 — 주소를 알면 누구나 그리로 값을 보낼 수 있다.
 */
export function readPostDraft(raw: {
  title: string;
  summary: string;
  body: string;
  badge: string;
  minutes: string;
  kind: unknown;
  tone: unknown;
  imageUrl: string;
}): DraftRead {
  const title = raw.title.trim();
  if (title.length === 0) return { ok: false, problem: "title-empty" };
  if (title.length > MAX_TITLE) return { ok: false, problem: "title-long" };

  const summary = raw.summary.trim();
  if (summary.length > MAX_SUMMARY) return { ok: false, problem: "summary-long" };

  /* 본문은 앞뒤 여백만 떼고 안쪽 줄바꿈은 그대로 둔다.
     사람이 문단을 나눠 쓴 것을 우리가 뭉개면 안 된다 */
  const body = raw.body.trim();
  if (body.length < MIN_BODY) return { ok: false, problem: "body-short" };
  if (body.length > MAX_BODY) return { ok: false, problem: "body-long" };

  const badge = raw.badge.trim();
  if (badge.length === 0) return { ok: false, problem: "badge-empty" };
  if (badge.length > MAX_BADGE) return { ok: false, problem: "badge-long" };

  /* 시간은 안 적어도 된다. 적었으면 숫자여야 하고 범위 안이어야 한다 —
     "30분쯤" 같은 글자가 들어오면 표가 거절한다 */
  let minutes: number | null = null;
  const typed = raw.minutes.trim();
  if (typed.length > 0) {
    const n = Number(typed);
    if (!Number.isFinite(n) || n < 1 || n > MAX_MINUTES) {
      return { ok: false, problem: "minutes-range" };
    }
    minutes = Math.round(n);
  }

  /* 그림 주소는 우리가 올린 것만 받는다. 남의 주소를 적어 넣으면
     그 서버가 우리 화면에 아무 그림이나 띄울 수 있다 */
  const imageUrl = raw.imageUrl.trim();
  const safeImage = imageUrl.startsWith("https://") && imageUrl.includes("/post-covers/")
    ? imageUrl
    : null;

  return {
    ok: true,
    draft: {
      title,
      summary,
      body,
      badge,
      minutes,
      kind: resolveKind(raw.kind),
      tone: resolveTone(raw.tone),
      imageUrl: safeImage,
    },
  };
}
