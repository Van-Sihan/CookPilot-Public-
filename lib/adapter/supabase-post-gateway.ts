import "server-only";

/**
 * 어댑터 · 글을 수파베이스 `posts` 표에 담는 진짜 방법.
 *
 * 유스케이스가 적어 둔 PostGateway 약속을 채워 준다.
 *
 * **글쓴이를 우리가 안 적는다.** 표가 `author_id default auth.uid()` 로 잡혀
 * 있고 그 칸에 넣을 권한을 아예 안 줬기 때문에, 넣지 않으면 로그인한 사람의
 * id 가 자동으로 박힌다. 우리가 적으면 남의 이름으로 글을 쓸 수 있게 된다.
 *
 * **펴내는 것도 우리가 못 한다.** `published` 칸에도 권한이 없다.
 * 대신 표가 열어 둔 `set_post_published` 함수를 부른다 — 그 함수가
 * "네 글이 맞느냐" 를 한 번 더 확인한다.
 */

import { createSupabaseServerClient } from "@/lib/adapter/supabase-server-client";
import type { PostDraft } from "@/lib/domain/post-draft";
import type { GatewayPost, PostGateway } from "@/lib/usecase/write-post";

// [F1][함수] supabasePostGateway: 유스케이스의 PostGateway 약속을 수파베이스로 채운다
export const supabasePostGateway: PostGateway = {
  // [F2][함수] publish(draft): 새 글을 표에 넣고 펴낸다
  // 입력: draft(PostDraft) → 처리: 로그인 확인 → posts insert → set_post_published rpc
  // 출력: {ok:true, id} 또는 까닭
  async publish(draft: PostDraft): Promise<GatewayPost> {
    try {
      const supabase = await createSupabaseServerClient();

      // 로그인했는지 먼저 본다. 안 했으면 표가 거절하는데 그 말이 사람에게 안 통한다
      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

      // [F3][외부] draft 의 칸들 ▷ posts insert → data.id (author_id·published 는 표가 정한다)
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: draft.title,
          // 빈 요약은 null 로 둔다. 빈 글자를 넣으면 카드가 빈 줄을 그린다
          summary: draft.summary || null,
          body: draft.body,
          badge: draft.badge,
          minutes: draft.minutes,
          kind: draft.kind,
          tone: draft.tone,
          image_url: draft.imageUrl,
        })
        // 방금 생긴 id 를 받아 와야 그 글로 데려갈 수 있다
        .select("id")
        .single();

      // [F4][분기] insert 실패 → true: 'rejected' 반환 / false: F5
      if (error || !data) return { ok: false, reason: "rejected" };

      /* 펴낸다. 이 한 걸음을 함수로 미뤄 둔 까닭은 위에 적어 두었다.
         칸 이름(post_id·publish)은 함수가 정한 그대로여야 한다 —
         다른 이름으로 부르면 함수를 못 찾고, 글은 안 펴낸 채로 남는다 */
      // [F5][외부] {post_id, publish:true} ▷ rpc('set_post_published') → publishError
      const { error: publishError } = await supabase.rpc("set_post_published", {
        post_id: data.id,
        publish: true,
      });

      /* 여기서 실패를 삼키면 안 된다. 글은 표에 들어갔지만 안 펴낸 글은
         아무에게도 안 보인다 — 쓴 사람 눈에는 그냥 "안 써졌다" 로 보인다.
         실제로 그렇게 만들었다가 글이 사라지는 것처럼 보였다 */
      // [F6][분기] 펴내기 실패 → true: 'rejected'(안 펴낸 글은 아무에게도 안 보인다) / false: F7
      if (publishError) return { ok: false, reason: "rejected" };

      // [F7][반환] {ok:true, id} → writePost → publishPostAction 이 /posts/<id> 로 보낸다
      return { ok: true, id: data.id as string };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },

  // [F8][함수] revise(id, draft): 이미 올린 글을 고친다
  // 입력: id + draft → 처리: posts update + select('id') 로 고쳐진 줄 확인 → 출력: GatewayPost
  async revise(id: string, draft: PostDraft): Promise<GatewayPost> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

      // [F9][외부] draft 의 칸들 ▷ posts update where id → data(고쳐진 줄), error
      const { data, error } = await supabase
        .from("posts")
        .update({
          title: draft.title,
          summary: draft.summary || null,
          body: draft.body,
          badge: draft.badge,
          minutes: draft.minutes,
          kind: draft.kind,
          tone: draft.tone,
          image_url: draft.imageUrl,
        })
        .eq("id", id)
        /* 어느 줄이 고쳐졌는지 받아 온다. 없으면 남의 글을 고치려 했을 때
           정책이 조용히 0줄을 고치고 error 도 안 내서 "고쳤다" 로 보인다 */
        .select("id");

      if (error) return { ok: false, reason: "rejected" };

      // 한 줄도 안 고쳐졌으면 내 글이 아니거나 없는 글이다
      // [F10][분기] 고쳐진 줄 0개(=남의 글) → 'rejected' / 1개 이상 → {ok:true, id}
      return data && data.length > 0
        ? { ok: true, id }
        : { ok: false, reason: "rejected" };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },

  // [F11][함수] remove(id): 글을 지운다
  // 입력: id → 처리: posts delete (딸린 댓글·좋아요는 cascade 로 함께 사라진다) → 출력: GatewayPost
  async remove(id: string): Promise<GatewayPost> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

      /* 글에 딸린 좋아요·즐겨찾기·댓글은 우리가 안 지운다.
         표에 `on delete cascade` 로 걸어 두어서 함께 사라진다 —
         여기서 하나씩 지우면 도중에 실패했을 때 반만 지워진 글이 남는다 */
      // [F12][외부] ▷ posts delete where id → data(지워진 줄), error
      const { data, error } = await supabase
        .from("posts")
        .delete()
        .eq("id", id)
        .select("id");

      if (error) return { ok: false, reason: "rejected" };

      // [F13][분기] 지워진 줄 0개 → 'rejected' / 1개 이상 → {ok:true, id} → removePostAction 으로
      return data && data.length > 0
        ? { ok: true, id }
        : { ok: false, reason: "rejected" };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },
};
