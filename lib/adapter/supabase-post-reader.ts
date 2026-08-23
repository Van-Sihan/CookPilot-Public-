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
import { resolveKind, resolveTone, type PostKind, type PostTone } from "@/lib/domain/post-draft";

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
  /** 언제 펴냈는지. 사람이 읽을 모양으로 다듬어 둔다 */
  published: string;
};

/** 표에서 오는 한 줄. 프로필은 붙여 온다 */
type Row = {
  id: string;
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
  profiles: { display_name: string } | { display_name: string }[] | null;
};

/** 한 줄을 글로 받아 준다 */
function readRow(row: Row): LivePost {
  /* 붙여 온 프로필은 하나일 수도 배열일 수도 있다. 관계를 어떻게 잡느냐에
     따라 모양이 달라져서 둘 다 받아 준다 */
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

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
    // "2026-08-23T…" 앞 열 자리가 날짜다. Date 로 바꾸면 시간대에 하루가 밀린다
    published: (row.published_at ?? "").slice(0, 10).replace(/-/g, ". "),
  };
}

/** 읽어 올 칸들. 프로필의 닉네임을 함께 붙여 온다 */
const COLUMNS =
  "id,title,summary,body,badge,minutes,kind,tone,image_url,like_count,published_at,profiles(display_name)";

/** 펴낸 글을 최신 순으로 가져온다. 목록 화면이 쓴다 */
export async function livePosts(limit = 20): Promise<readonly LivePost[]> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("posts")
      .select(COLUMNS)
      // 펴낸 것만. RLS 도 막아 주지만 여기서도 좁혀 둔다
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return (data as unknown as Row[]).map(readRow);
  } catch {
    // 표가 아직 없거나(마이그레이션 전) 못 다녀왔으면 예시 글만 보인다
    return [];
  }
}

/** 글 하나를 id 로 가져온다. 없으면 null */
export async function livePost(id: string): Promise<LivePost | null> {
  /* uuid 모양이 아니면 다녀올 까닭이 없다. 예시 글 id("ribeye")가
     여기로 오면 수파베이스가 오류를 내는데, 그건 고장이 아니라 남의 id 다 */
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("posts")
      .select(COLUMNS)
      .eq("id", id)
      .eq("published", true)
      .single();

    if (error || !data) return null;

    return readRow(data as unknown as Row);
  } catch {
    return null;
  }
}
