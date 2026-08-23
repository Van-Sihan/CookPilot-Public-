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

export const supabasePostGateway: PostGateway = {
  async publish(draft: PostDraft): Promise<GatewayPost> {
    try {
      const supabase = await createSupabaseServerClient();

      // 로그인했는지 먼저 본다. 안 했으면 표가 거절하는데 그 말이 사람에게 안 통한다
      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

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

      if (error || !data) return { ok: false, reason: "rejected" };

      /* 펴낸다. 이 한 걸음을 함수로 미뤄 둔 까닭은 위에 적어 두었다.
         칸 이름(post_id·publish)은 함수가 정한 그대로여야 한다 —
         다른 이름으로 부르면 함수를 못 찾고, 글은 안 펴낸 채로 남는다 */
      const { error: publishError } = await supabase.rpc("set_post_published", {
        post_id: data.id,
        publish: true,
      });

      /* 여기서 실패를 삼키면 안 된다. 글은 표에 들어갔지만 안 펴낸 글은
         아무에게도 안 보인다 — 쓴 사람 눈에는 그냥 "안 써졌다" 로 보인다.
         실제로 그렇게 만들었다가 글이 사라지는 것처럼 보였다 */
      if (publishError) return { ok: false, reason: "rejected" };

      return { ok: true, id: data.id as string };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },
};
