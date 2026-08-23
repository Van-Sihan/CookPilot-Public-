import "server-only";

/**
 * 어댑터 · 좋아요와 즐겨찾기를 수파베이스에 담는 진짜 방법.
 *
 * 유스케이스가 적어 둔 ReactionGateway 약속을 채워 준다.
 *
 * **누가 눌렀는지 우리가 안 적는다.** 두 표 모두 `user_id default auth.uid()` 로
 * 잡혀 있고 그 칸에 넣을 권한을 아예 안 줬다. 우리가 적으면 남의 이름으로
 * 좋아요를 누를 수 있게 된다.
 *
 * **숫자도 우리가 안 센다.** posts.like_count 는 표에 걸어 둔 방아쇠가 맞춘다.
 * 앱이 세어 넣게 두면 언젠가 두 번 세거나 빼먹는다.
 */

import { createSupabaseServerClient } from "@/lib/adapter/supabase-server-client";
import type { GatewayReaction, ReactionGateway } from "@/lib/usecase/react-to-post";

/**
 * 두 표가 똑같이 하는 일. 넣거나 빼거나 둘 중 하나다.
 *
 * 같은 줄을 두 번 넣으면 기본 키에 걸린다. 그 오류(23505)는 실패가 아니라
 * **이미 눌러 둔 상태**라는 뜻이라 성공으로 본다 — 두 번 눌러도 하나여야 한다는
 * 규칙이 표에 적혀 있고, 여기서는 그 결과를 그대로 받아들이면 된다.
 */
// [F1][함수] set(table, postId, on): 좋아요·즐겨찾기가 똑같이 하는 일
// 입력: table('post_likes'|'post_bookmarks') + postId + on → 처리: insert 또는 delete
// 출력: GatewayReaction (F5·F6 이 부른다)
async function set(
  table: "post_likes" | "post_bookmarks",
  postId: string,
  on: boolean,
): Promise<GatewayReaction> {
  try {
    const supabase = await createSupabaseServerClient();

    // 로그인했는지 먼저 본다. 안 했으면 표가 거절하는데 그 말이 사람에게 안 통한다
    // [F2][외부] ▷ supabase.auth.getUser() → me (로그인 확인)
    const { data: me } = await supabase.auth.getUser();
    if (!me.user) return { ok: false, reason: "signed-out" };

    // [F3][분기] on === true → 넣기(F4) / false → 빼기(F4b)
    if (on) {
      // user_id 를 안 적는다. 위에 적어 둔 까닭이다
      // [F4][외부] {post_id} ▷ table insert → error (user_id 는 표의 기본값이 박는다)
      const { error } = await supabase.from(table).insert({ post_id: postId });

      // 이미 눌러 둔 것이면 그대로 둔다
      // [F4a][분기] 23505(이미 눌러 둠)는 성공으로 본다 / 다른 오류 → 'rejected'
      if (error && error.code !== "23505") return { ok: false, reason: "rejected" };

      return { ok: true };
    }

    /* 뺄 때도 내 줄만 짚어 준다. RLS 가 막아 주지만 여기서도 좁혀 둔다 —
       정책이 한 번 느슨해지면 이 코드가 남의 좋아요를 지우는 코드가 된다 */
    // [F4b][외부] ▷ table delete where post_id=…, user_id=나 → error
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("post_id", postId)
      .eq("user_id", me.user.id);

    // [F4c][반환] 결과 → toggleLike·toggleBookmark(usecase) 로 전달
    return error ? { ok: false, reason: "rejected" } : { ok: true };
  } catch {
    return { ok: false, reason: "unreachable" };
  }
}

// [F5][함수] supabaseReactionGateway: ReactionGateway 약속을 두 표로 채운다
// setLike → post_likes / setBookmark → post_bookmarks. 둘 다 F1 을 부른다
export const supabaseReactionGateway: ReactionGateway = {
  setLike(postId: string, on: boolean) {
    return set("post_likes", postId, on);
  },

  setBookmark(postId: string, on: boolean) {
    return set("post_bookmarks", postId, on);
  },
};

/**
 * 지금 로그인한 사람이 이 글에 무엇을 눌러 뒀는지.
 *
 * 화면을 그리기 전에 알아야 하는 값이라 게이트웨이가 아니라 여기 따로 둔다 —
 * ReactionGateway 는 "바꾸는" 약속이고, 이것은 "읽는" 일이다.
 *
 * 로그인 안 했으면 둘 다 false 다. 정책상 남의 줄은 아예 안 보이므로
 * 굳이 따로 막지 않아도 빈 값이 온다.
 */
// [F6][함수] myReactions(postId): 내가 이 글에 무엇을 눌러 뒀는지 읽는다
// 입력: postId → 처리: 두 표를 한꺼번에 조회 → 출력: {liked, saved}
export async function myReactions(
  postId: string,
): Promise<{ liked: boolean; saved: boolean }> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: me } = await supabase.auth.getUser();
    // [F7][분기] 로그인 안 됨 → true: 둘 다 false 반환 / false: F8
    if (!me.user) return { liked: false, saved: false };

    /* 두 표를 한꺼번에 물어본다. 차례로 기다리면 왕복이 두 번이 되는데,
       서로 아무 상관이 없는 물음이라 같이 보내도 된다 */
    // [F8][외부] ▷ post_likes · post_bookmarks 를 Promise.all 로 동시에 조회 → like, mark
    const [like, mark] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", me.user.id)
        // 없을 수도 있는 값이라 single() 이 아니라 maybeSingle() 을 쓴다.
        // single() 은 줄이 없으면 오류를 낸다
        .maybeSingle(),
      supabase
        .from("post_bookmarks")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", me.user.id)
        .maybeSingle(),
    ]);

    // [F9][반환] {liked, saved} → app/posts/[id]/page.tsx → PostActions 의 처음 상태로
    return { liked: Boolean(like.data), saved: Boolean(mark.data) };
  } catch {
    // 못 물어봤으면 안 누른 것으로 본다. 화면은 뜨는 편이 낫다
    return { liked: false, saved: false };
  }
}
