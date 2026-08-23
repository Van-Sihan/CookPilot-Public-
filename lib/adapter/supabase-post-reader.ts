import "server-only";

/**
 * 어댑터 · 수파베이스에 올라온 글을 읽어 온다.
 *
 * 예시 글 열여섯 편은 파일에 있고([[site-content]]), 사람이 쓴 글은 여기 있다.
 * 두 곳에서 읽는 것이 어수선해 보이지만, 예시 글을 표로 옮기는 일은
 * 따로 해야 하는 일이라 지금 섞으면 둘 다 어중간해진다.
 *
 * 읽기만 한다. 쓰는 일은 [[supabase-post-gateway]] 가 맡는다 —
 * 읽는 쪽은 로그인 없이도 불리므로 갈라 두는 편이 안전하다.
 */

import { createSupabaseServerClient } from "@/lib/adapter/supabase-server-client";
import { readAvatarUrl } from "@/lib/domain/avatar";
import { resolveKind, resolveTone, type PostKind, type PostTone } from "@/lib/domain/post-draft";
import type { LiveComment } from "@/lib/usecase/discuss-post";

/** 표에서 읽어 온 글 한 편 */
export type LivePost = {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  badge: string;
  minutes: number | null;
  kind: PostKind;
  tone: PostTone;
  imageUrl: string | null;
  likeCount: number;
  /** 올린 사람의 닉네임. 프로필이 없으면 "알 수 없음" */
  chef: string;
  /** 올린 사람의 프로필 사진. 없으면 null */
  chefAvatar: string | null;
  /** 지금 보는 사람이 이 글의 주인인지. 고치기·지우기 단추를 붙일지 정한다 */
  mine: boolean;
  /** 언제 펴냈는지. 사람이 읽을 모양으로 다듬어 둔다 */
  published: string;
};

/** 표에서 오는 한 줄. 프로필은 붙여 온다 */
type Row = {
  id: string;
  author_id: string;
  title: string;
  summary: string | null;
  body: string | null;
  badge: string;
  minutes: number | null;
  kind: string;
  tone: string;
  image_url: string | null;
  like_count: number;
  published_at: string | null;
  profiles: Profile | Profile[] | null;
};

/** 붙여 오는 프로필 조각. 관계를 어떻게 잡느냐에 따라 하나로도 배열로도 온다 */
type Profile = { display_name: string; avatar_url: string | null };

/** 한 줄을 글로 받아 준다. `meId` 는 지금 로그인한 사람. 없으면 null */
// [F1][함수] readRow(row, meId): 표에서 온 한 줄을 화면이 쓰는 LivePost 로 옮긴다
// 입력: row + meId(지금 로그인한 사람) → 처리: 프로필 펴기·주소 검사·주인 판정 → 출력: LivePost
function readRow(row: Row, meId: string | null): LivePost {
  /* 붙여 온 프로필은 하나일 수도 배열일 수도 있다. 관계를 어떻게 잡느냐에
     따라 모양이 달라져서 둘 다 받아 준다 */
  // [F2][흐름] row.profiles(하나 또는 배열) → profile
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

  // [F3][호출] profile?.avatar_url → readAvatarUrl(domain/avatar) → chefAvatar
  // [F3][반환] LivePost → community/page.tsx · posts/[id]/page.tsx 로 전달
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    body: row.body ?? "",
    badge: row.badge,
    minutes: row.minutes,
    kind: resolveKind(row.kind),
    tone: resolveTone(row.tone),
    imageUrl: row.image_url,
    likeCount: row.like_count,
    chef: profile?.display_name ?? "알 수 없음",
    // 남이 준 주소를 그대로 붙이지 않는다. 우리 자리에서 온 것만 통과한다
    chefAvatar: readAvatarUrl(profile?.avatar_url),
    /* 주인인지는 **서버가 정한다.** 화면이 닉네임을 견줘 정하게 두면
       같은 이름을 가진 사람에게 남의 글 고치기 단추가 붙는다 */
    mine: meId !== null && row.author_id === meId,
    // "2026-08-23T…" 앞 열 자리가 날짜다. Date 로 바꾸면 시간대에 하루가 밀린다
    published: (row.published_at ?? "").slice(0, 10).replace(/-/g, ". "),
  };
}

/** 읽어 올 칸들. 프로필의 닉네임과 사진을 함께 붙여 온다 */
const COLUMNS =
  "id,author_id,title,summary,body,badge,minutes,kind,tone,image_url,like_count,published_at," +
  "profiles(display_name,avatar_url)";

/**
 * 프로필 사진 칸을 뺀 목록.
 *
 * 마이그레이션을 아직 안 돌린 데이터베이스에는 `profiles.avatar_url` 이 없다.
 * 없는 칸을 달라고 하면 수파베이스는 **물음 전체를 거절한다** — 사진 하나 때문에
 * 커뮤니티 목록이 통째로 비어 버린다.
 *
 * 코드를 먼저 올리고 SQL 을 나중에 돌리는 일은 실제로 늘 일어난다.
 * 그 몇 분 동안 글이 하나도 안 보이는 것보다는, 사진 없이 보이는 편이 낫다.
 */
const COLUMNS_NO_AVATAR = COLUMNS.replace(",avatar_url", "");

/** 댓글에서 읽어 올 칸들. 위와 같은 까닭으로 두 벌을 둔다 */
const COMMENT_COLUMNS =
  "id,author_id,body,created_at,updated_at,profiles(display_name,avatar_url)";
const COMMENT_COLUMNS_NO_AVATAR = COMMENT_COLUMNS.replace(",avatar_url", "");

/**
 * 없는 칸 때문에 거절당한 것인지 본다.
 *
 * 42703 은 postgres 가 "그런 칸 없다" 고 할 때 쓰는 번호다. 수파베이스는
 * 붙여 오는 표(profiles)의 칸이 틀리면 PGRST200 을 내기도 해서 둘 다 본다.
 * 다른 까닭으로 실패한 것까지 다시 물어보면 같은 실패를 두 번 하게 된다.
 */
// [F4][함수] missingColumn(error): '없는 칸' 때문에 거절당한 것인지 판정
// 입력: 수파베이스 오류 → 처리: 42703·PGRST200·avatar_url 문구 확인 → 출력: boolean
function missingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;

  return (
    error.code === "42703" ||
    error.code === "PGRST200" ||
    Boolean(error.message?.includes("avatar_url"))
  );
}

/**
 * 지금 로그인한 사람의 id. 없으면 null.
 *
 * 글마다 "내 글인가" 를 붙여 주려면 있어야 하는 값이다.
 * 실패를 null 로 삼키는 까닭 — 로그인 안 한 사람에게도 목록은 떠야 한다.
 */
// [F5][함수] currentUserId(supabase): 지금 로그인한 사람의 id
// 입력: supabase 손잡이 → 처리: ▷ auth.getUser() → 출력: id 또는 null
async function currentUserId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

/** 펴낸 글을 최신 순으로 가져온다. 목록 화면이 쓴다 */
// [F6][함수] livePosts(limit): 펴낸 글을 최신 순으로 읽어 온다
// 입력: limit → 처리: posts select(+profiles) → 없는 칸이면 한 번 더 → readRow 로 옮김
// 출력: LivePost[] (비동기)
export async function livePosts(limit = 20): Promise<readonly LivePost[]> {
  try {
    const supabase = await createSupabaseServerClient();

    /** 같은 물음을 칸 목록만 바꿔 두 번 쓸 수 있게 묶어 둔다 */
    const ask = (columns: string) =>
      supabase
        .from("posts")
        .select(columns)
        // 펴낸 것만. RLS 도 막아 주지만 여기서도 좁혀 둔다
        .eq("published", true)
        .order("published_at", { ascending: false })
        .limit(limit);

    // [F7][외부] ▷ posts select(published=true, 최신순) → data, error
    let { data, error } = await ask(COLUMNS);

    // 사진 칸이 아직 없는 데이터베이스면 그 칸만 빼고 한 번 더 물어본다
    // [F8][분기] 사진 칸이 아직 없는 DB → true: 그 칸만 빼고 다시 조회 / false: 그대로
    if (missingColumn(error)) ({ data, error } = await ask(COLUMNS_NO_AVATAR));

    // [F9][분기] 그래도 실패 → true: 빈 배열(예시 글만 보인다) / false: F10
    if (error || !data) return [];

    const meId = await currentUserId(supabase);

    // [F10][반복] data 를 훑으며 readRow(F1) → LivePost[] → community/page.tsx 로 전달
    return (data as unknown as Row[]).map((row) => readRow(row, meId));
  } catch {
    // 표가 아직 없거나(마이그레이션 전) 못 다녀왔으면 예시 글만 보인다
    return [];
  }
}

/** 글 하나를 id 로 가져온다. 없으면 null */
// [F11][함수] livePost(id): 펴낸 글 하나를 id 로 읽어 온다
// 입력: id → 처리: uuid 검사 → posts select single → readRow → 출력: LivePost 또는 null
export async function livePost(id: string): Promise<LivePost | null> {
  /* uuid 모양이 아니면 다녀올 까닭이 없다. 예시 글 id("ribeye")가
     여기로 오면 수파베이스가 오류를 내는데, 그건 고장이 아니라 남의 id 다 */
  // [F12][분기] uuid 가 아님(예시 글 id) → true: null 반환(다녀가지 않음) / false: F13
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  try {
    const supabase = await createSupabaseServerClient();

    const ask = (columns: string) =>
      supabase
        .from("posts")
        .select(columns)
        .eq("id", id)
        .eq("published", true)
        .single();

    let { data, error } = await ask(COLUMNS);

    if (missingColumn(error)) ({ data, error } = await ask(COLUMNS_NO_AVATAR));

    if (error || !data) return null;

    // [F13][호출] data → readRow(F1) → LivePost → posts/[id]/page.tsx · edit/page.tsx 로 전달
    return readRow(data as unknown as Row, await currentUserId(supabase));
  } catch {
    return null;
  }
}


/** 댓글 표에서 오는 한 줄 */
type CommentRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: Profile | Profile[] | null;
};

/**
 * 글 하나에 달린 댓글을 시간 순으로 읽어 온다.
 *
 * `postAuthorId` 를 함께 받는 까닭 — 댓글은 **쓴 사람과 글 주인** 둘 다 지울 수
 * 있다(마이그레이션 참고). 그 판단을 화면이 하게 두면 규칙이 두 곳에 생기므로
 * 여기서 정해 boolean 으로 내려 준다.
 */
// [F14][함수] postComments(postId, postAuthorId): 그 글의 댓글을 시간 순으로 읽어 온다
// 입력: postId + postAuthorId(글 주인) → 처리: post_comments select → 권한 판정 붙이기
// 출력: LiveComment[] (비동기)
export async function postComments(
  postId: string,
  postAuthorId?: string,
): Promise<readonly LiveComment[]> {
  // 예시 글 id 로 물어보면 수파베이스가 오류를 낸다. 그건 고장이 아니라 남의 id 다
  if (!/^[0-9a-f-]{36}$/i.test(postId)) return [];

  try {
    const supabase = await createSupabaseServerClient();

    const ask = (columns: string) =>
      supabase
        .from("post_comments")
        .select(columns)
        .eq("post_id", postId)
        // 오래된 것이 위로. 대화는 위에서 아래로 읽는다
        .order("created_at", { ascending: true });

    // [F15][외부] ▷ post_comments select(post_id, 오래된 순) → data, error
    let { data, error } = await ask(COMMENT_COLUMNS);

    if (missingColumn(error)) ({ data, error } = await ask(COMMENT_COLUMNS_NO_AVATAR));

    if (error || !data) return [];

    const meId = await currentUserId(supabase);

    // [F16][반복] data 를 훑으며 한 줄씩 LiveComment 로 옮긴다
    // [F16][흐름] row.author_id 와 meId 비교 → mine / 글 주인이면 canRemove 도 true
    return (data as unknown as CommentRow[]).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const mine = meId !== null && row.author_id === meId;

      return {
        id: row.id,
        who: profile?.display_name ?? "알 수 없음",
        avatar: readAvatarUrl(profile?.avatar_url),
        when: whenText(row.created_at),
        text: row.body,
        /* 고친 적이 있는지. 표가 만들 때 두 시각을 같은 값으로 넣으므로
           1초라도 벌어져 있으면 고친 것이다. 밀리초까지 견주면 저장 지연 때문에
           안 고친 댓글도 "고침" 으로 보인다 */
        edited: new Date(row.updated_at).getTime() - new Date(row.created_at).getTime() > 1000,
        mine,
        // 내가 썼거나, 내 글에 달린 댓글이면 지울 수 있다
        canRemove: mine || (meId !== null && postAuthorId === meId),
      };
    });
  } catch {
    // 표가 아직 없거나(마이그레이션 전) 못 다녀왔으면 댓글 없는 글로 보인다
    return [];
  }
}

/**
 * 언제 썼는지를 사람이 읽을 모양으로.
 *
 * 오늘 것은 시각으로, 그보다 오래된 것은 날짜로 적는다.
 * 방금 쓴 댓글에 "2026. 08. 24." 만 뜨면 내가 쓴 것이 맞는지 알 수 없고,
 * 지난달 댓글에 "14:32" 만 뜨면 언제 것인지 알 수 없다.
 */
// [F17][함수] whenText(iso): 언제 썼는지를 사람이 읽을 모양으로
// 입력: iso 시각 글자 → 처리: 오늘이면 'HH:MM', 아니면 'YYYY. MM. DD' → 출력: 문자열
function whenText(iso: string): string {
  const at = new Date(iso);

  // 못 읽는 값이 오면 빈 글자로 둔다. "Invalid Date" 를 화면에 내보내지 않는다
  // [F18][분기] 못 읽는 시각 → true: 빈 글자 반환('Invalid Date' 를 안 내보낸다) / false: F19
  if (Number.isNaN(at.getTime())) return "";

  const now = new Date();
  const sameDay =
    at.getFullYear() === now.getFullYear() &&
    at.getMonth() === now.getMonth() &&
    at.getDate() === now.getDate();

  const two = (n: number) => String(n).padStart(2, "0");

  return sameDay
    ? `${two(at.getHours())}:${two(at.getMinutes())}`
    : `${at.getFullYear()}. ${two(at.getMonth() + 1)}. ${two(at.getDate())}`;
}

/**
 * 글 주인의 id.
 *
 * 댓글을 읽을 때 "내 글에 달린 댓글인가" 를 가르려면 있어야 한다.
 * 글 전체를 다시 읽지 않고 이 한 칸만 물어보는 까닭은, 이미 읽어 둔 글이
 * 있는 자리에서 부르기 때문이다.
 */
// [F19][함수] postAuthorId(postId): 글 주인의 id 만 읽어 온다
// 입력: postId → 처리: ▷ posts select(author_id) → 출력: id 또는 null
// [F19][반환] id → postComments(F14) 의 canRemove 판정에 쓰인다
export async function postAuthorId(postId: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(postId)) return null;

  try {
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
      .from("posts")
      .select("author_id")
      .eq("id", postId)
      .maybeSingle();

    return (data?.author_id as string | undefined) ?? null;
  } catch {
    return null;
  }
}
