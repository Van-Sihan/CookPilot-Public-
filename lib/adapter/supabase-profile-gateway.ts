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
import { readAvatarUrl } from "@/lib/domain/avatar";
import type { GatewayRename, MyProfile, ProfileGateway } from "@/lib/usecase/rename-me";

// [F1][함수] supabaseProfileGateway: 유스케이스의 ProfileGateway 약속을 수파베이스로 채운다
export const supabaseProfileGateway: ProfileGateway = {
  // [F2][함수] myName(): 내 닉네임만 읽어 온다
  // 입력: 없음 → 처리: getUser → ▷ profiles select(display_name) → 출력: 이름 또는 null
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

  // [F3][함수] myProfile(): 닉네임과 프로필 사진을 함께 읽어 온다
  // 입력: 없음 → 처리: getUser → ▷ profiles select(display_name, avatar_url) → readAvatarUrl 로 거름
  // 출력: {name, avatar} 또는 null
  async myProfile(): Promise<MyProfile | null> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("display_name,avatar_url")
        .eq("id", me.user.id)
        .single();

      // [F4][분기] 줄이 없음 → true: null 반환 / false: F5
      if (!data) return null;

      // [F5][호출] data.avatar_url → readAvatarUrl(domain/avatar) → avatar
      // [F5][반환] {name, avatar} → account/page.tsx · community/page.tsx 로 전달
      return {
        name: (data.display_name as string | null) ?? "",
        // 남이 준 주소를 그대로 붙이지 않는다. 우리 자리에서 온 것만 통과한다
        avatar: readAvatarUrl(data.avatar_url),
      };
    } catch {
      return null;
    }
  },

  // [F6][함수] setAvatar(url): 프로필 사진 주소를 갈아 끼운다(null 이면 뗀다)
  // 입력: url → 처리: getUser → ▷ profiles update(avatar_url) where id=나 → 출력: GatewayRename
  async setAvatar(url: string | null): Promise<GatewayRename> {
    try {
      const supabase = await createSupabaseServerClient();

      const { data: me } = await supabase.auth.getUser();
      if (!me.user) return { ok: false, reason: "signed-out" };

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        // 내 줄만. 닉네임과 같은 까닭이다
        .eq("id", me.user.id);

      return error ? { ok: false, reason: "rejected" } : { ok: true };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },

  // [F7][함수] rename(name): 닉네임을 바꾼다
  // 입력: name → 처리: getUser → ▷ profiles update(display_name) where id=나 → 출력: GatewayRename
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

      // [F8][분기] error 없음 → true: {ok:true} / false: F9
      if (!error) return { ok: true };

      /* 같은 이름을 이미 누가 쓰고 있으면 unique 에 걸린다.
         23505 는 그때 나오는 번호다 — 사람에게는 "이미 쓰는 이름" 이라고
         말해 줘야 무엇을 고쳐야 할지 안다 */
      // [F9][에러] 23505(unique 충돌) → 'taken'(이미 쓰는 이름) / 그 밖 → 'rejected'
      return { ok: false, reason: error.code === "23505" ? "taken" : "rejected" };
    } catch {
      return { ok: false, reason: "unreachable" };
    }
  },
};
