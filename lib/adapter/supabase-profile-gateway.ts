import "server-only";

/**
 * 어댑터 · 프로필(닉네임)을 수파베이스에서 읽고 고치는 진짜 방법.
 *
 * 유스케이스가 적어 둔 ProfileGateway 약속을 채워 준다.
 *
 * 어느 줄을 고칠지 우리가 정하지 않는다 — `eq("id", 내 id)` 로 못 박는다.
 * RLS 가 한 번 더 막아 주지만, 여기서도 좁혀 두는 편이 낫다.
 * 정책이 한 번 느슨해지면 이 코드가 남의 이름을 바꾸는 코드가 되기 때문이다.
 */

import { createSupabaseServerClient } from "@/lib/adapter/supabase-server-client";
import type { GatewayRename, ProfileGateway } from "@/lib/usecase/rename-me";

export const supabaseProfileGateway: ProfileGateway = {
  async myName() {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", me.user.id)
        .single();

      return (data?.display_name as string | undefined) ?? null;
    } catch {
      // 못 읽었으면 이름이 없는 것과 같이 본다. 화면은 빈 칸으로 시작한다
      return null;
    }
  },

  async rename(name: string): Promise<GatewayRename> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name })
        // 내 줄만. 위에 적어 둔 까닭이다
        .eq("id", me.user.id);

      if (!error) return { ok: true };

      /* 같은 이름을 이미 누가 쓰고 있으면 unique 에 걸린다.
         23505 는 그때 나오는 번호다 — 사람에게는 "이미 쓰는 이름" 이라고
         말해 줘야 무엇을 고쳐야 할지 안다 */
      return { ok: false, reason: error.code === "23505" ? "taken" : "rejected" };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },
};
