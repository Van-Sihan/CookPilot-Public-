import "server-only";

/**
 * 어댑터 · 댓글을 수파베이스 `post_comments` 표에 담는 진짜 방법.
 *
 * 유스케이스가 적어 둔 CommentGateway 약속을 채워 준다.
 *
 * **쓴 사람을 우리가 안 적는다.** 글과 같은 방식이다 —
 * `author_id default auth.uid()` 로 잡혀 있고 그 칸에 넣을 권한이 없다.
 *
 * **누가 고치고 지울 수 있는지도 우리가 안 따진다.** 표의 정책이 정한다.
 * 여기서 한 번 더 따지면 규칙이 두 곳에 생기고, 언젠가 둘이 어긋난다.
 * 그래서 남의 댓글을 고치려 들면 "한 줄도 안 고쳐졌다" 로 돌아오고,
 * 우리는 그것을 거절로 옮겨 적기만 한다.
 */

import { createSupabaseServerClient } from "@/lib/adapter/supabase-server-client";
import type { CommentGateway, GatewayComment } from "@/lib/usecase/discuss-post";

// [F1][함수] supabaseCommentGateway: 유스케이스의 CommentGateway 약속을 수파베이스로 채운다
export const supabaseCommentGateway: CommentGateway = {
  // [F2][함수] add(postId, text): 댓글 한 줄을 표에 넣는다
  // 입력: postId + text → 처리: 로그인 확인 → insert → 출력: GatewayComment
  async add(postId: string, text: string): Promise<GatewayComment> {
    try {
      const supabase = await createSupabaseServerClient();

      // [F3][외부] ▷ supabase.auth.getUser() → me (로그인 확인)
      const { data: me } = await supabase.auth.getUser();
      // [F4][분기] 로그인 안 됨 → true: 'signed-out' 반환 / false: F5
      if (!me.user) return { ok: false, reason: "signed-out" };

      // [F5][외부] {post_id, body} ▷ post_comments insert → error (author_id 는 표의 기본값이 박는다)
      const { error } = await supabase
        .from("post_comments")
        .insert({ post_id: postId, body: text });

      // [F6][반환] error 있으면 'rejected', 없으면 {ok:true} → writeComment(usecase) 로 전달
      return error ? { ok: false, reason: "rejected" } : { ok: true };
    } catch {
      // [F7][에러] 다녀오지 못함 → 'unreachable' 반환
      return { ok: false, reason: "unreachable" };
    }
  },

  // [F8][함수] edit(commentId, text): 내가 쓴 댓글을 고친다
  // 입력: commentId + text → 처리: update + select('id') 로 고쳐진 줄 수 확인 → 출력: GatewayComment
  async edit(commentId: string, text: string): Promise<GatewayComment> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

      // [F9][외부] {body} ▷ post_comments update where id → data(고쳐진 줄), error
      const { data, error } = await supabase
        .from("post_comments")
        .update({ body: text })
        .eq("id", commentId)
        /* 어느 줄이 고쳐졌는지 받아 온다. 이것이 없으면 남의 댓글을 고치려 했을 때
           정책이 조용히 0줄을 고치고 error 도 안 내서, 화면에는 "고쳤다" 고 뜬다 */
        .select("id");

      // [F10][분기] error 있음 → true: 'rejected' / false: F11
      if (error) return { ok: false, reason: "rejected" };

      // 한 줄도 안 고쳐졌으면 내 댓글이 아니거나 없는 댓글이다
      // [F11][분기] 고쳐진 줄이 0개(=남의 댓글) → 'rejected' / 1개 이상 → {ok:true}
      return data && data.length > 0 ? { ok: true } : { ok: false, reason: "rejected" };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },

  // [F12][함수] remove(commentId): 댓글을 지운다
  // 입력: commentId → 처리: delete + select('id') 로 지워진 줄 수 확인 → 출력: GatewayComment
  async remove(commentId: string): Promise<GatewayComment> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

      // [F13][외부] ▷ post_comments delete where id → data(지워진 줄), error
      const { data, error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId)
        // 고치기와 같은 까닭. 0줄이 지워진 것과 지운 것을 갈라야 한다
        .select("id");

      if (error) return { ok: false, reason: "rejected" };

      // [F14][분기] 지워진 줄이 0개 → 'rejected' / 1개 이상 → {ok:true} → dropComment 로 전달
      return data && data.length > 0 ? { ok: true } : { ok: false, reason: "rejected" };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },
};
