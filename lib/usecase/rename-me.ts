/**
 * 유스케이스 · "내 닉네임을 바꾼다".
 *
 * 닉네임은 남들에게 보이는 이름이다. 그래서 바꾸는 일이 로그인만큼이나
 * 자주 있고, 못 바꾸면 처음 지은 이름에 갇힌다.
 *
 * 규칙(길이 등)은 도메인이 정하고, 어디에 담는지는 게이트웨이가 안다.
 */

import { readAvatarUrl } from "@/lib/domain/avatar";
import { checkDisplayName, type DisplayNameProblem } from "@/lib/domain/display-name";

/** 프로필을 고쳐 주는 곳이 지켜야 할 약속 */
export type ProfileGateway = {
  /** 지금 로그인한 사람의 닉네임을 바꾼다 */
  rename(name: string): Promise<GatewayRename>;
  /** 지금 로그인한 사람의 닉네임을 읽어 온다. 없으면 null */
  myName(): Promise<string | null>;
  /** 닉네임과 프로필 사진을 함께 읽어 온다. 로그인 안 했으면 null */
  myProfile(): Promise<MyProfile | null>;
  /** 프로필 사진 주소를 바꾼다. null 을 주면 사진을 뗀다 */
  setAvatar(url: string | null): Promise<GatewayRename>;
};

/** 화면이 쓰는 내 프로필 */
export type MyProfile = {
  /** 남에게 보이는 이름 */
  name: string;
  /** 프로필 사진 주소. 없으면 null */
  avatar: string | null;
};

/** 프로필을 고쳐 주는 곳이 돌려주는 대답 */
export type GatewayRename =
  | { ok: true }
  /** 로그인이 안 되어 있다 */
  | { ok: false; reason: "signed-out" }
  /** 이미 누가 쓰는 이름이다 */
  | { ok: false; reason: "taken" }
  /** 표가 거절했다 */
  | { ok: false; reason: "rejected" }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 화면이 받아 보는 결과 */
export type RenameResult =
  | { ok: true; name: string }
  | { ok: false; reason: DisplayNameProblem | Exclude<GatewayRename, { ok: true }>["reason"] };

/** 닉네임을 바꾼다 */
// [F1][함수] renameMe(raw, gateway): 닉네임을 바꾼다
// 입력: raw(계정 설정 입력칸) + gateway(ProfileGateway) → 처리: 도메인 검사 → 표 갱신
// 출력: RenameResult (비동기)
export async function renameMe(
  raw: string,
  gateway: ProfileGateway,
): Promise<RenameResult> {
  // 받아 줄 만한 이름인지는 도메인이 본다. 가입할 때와 같은 규칙이다
  // [F2][호출] raw → checkDisplayName(domain/display-name) → read
  const read = checkDisplayName(raw);

  // [F3][분기] read.ok → false: 까닭 반환(서버에 안 다녀옴) / true: F4
  if (!read.ok) return { ok: false, reason: read.problem };

  // [F4][외부] read.name → gateway.rename() ▷ supabase profiles.display_name 갱신 → done
  const done = await gateway.rename(read.name);

  // [F5][반환] {ok:true, name} 또는 까닭 → renameAction(app/actions/post.ts) 으로 전달
  return done.ok ? { ok: true, name: read.name } : { ok: false, reason: done.reason };
}


/**
 * 프로필 사진을 갈아 끼운다.
 *
 * 올리는 일은 여기서 안 한다. 파일을 스토리지에 올리는 것은 브라우저가 하고,
 * 여기 오는 것은 **다 올라간 뒤의 주소 한 줄**이다. 그렇게 나눠 둔 까닭 —
 * 파일 올리기는 오래 걸리고 도중에 끊길 수 있는 일이라, 그 사이에 서버를
 * 붙들고 있으면 화면이 통째로 멈춘다.
 *
 * 주소가 우리 자리에서 온 것인지는 도메인이 본다. 남의 주소를 그대로 담으면
 * 그 서버가 우리 사용자를 들여다보게 된다.
 */
// [F6][함수] changeMyPhoto(raw, gateway): 프로필 사진 주소를 갈아 끼운다
// 입력: raw(브라우저가 올리고 받은 주소, 뗄 때는 null) + gateway → 처리: 주소 검사 → 표 갱신
// 출력: PhotoResult (비동기)
export async function changeMyPhoto(
  raw: string | null,
  gateway: ProfileGateway,
): Promise<PhotoResult> {
  // 뗀다는 뜻이면 검사할 것이 없다
  // [F7][분기] raw 가 비었음(=사진 떼기) → true: gateway.setAvatar(null) 후 반환 / false: F8
  if (raw === null || raw.trim().length === 0) {
    const cleared = await gateway.setAvatar(null);

    return cleared.ok ? { ok: true, url: null } : { ok: false, reason: cleared.reason };
  }

  // [F8][호출] raw → readAvatarUrl(domain/avatar) → url
  const url = readAvatarUrl(raw);

  // 우리 자리에서 온 주소가 아니면 담지 않는다
  // [F9][분기] 우리 버킷 주소가 아님 → true: 'bad-url' 반환 / false: F10
  if (!url) return { ok: false, reason: "bad-url" };

  // [F10][외부] url → gateway.setAvatar() ▷ supabase profiles.avatar_url 갱신 → done
  const done = await gateway.setAvatar(url);

  // [F11][반환] {ok:true, url} 또는 까닭 → setPhotoAction(app/actions/post.ts) 으로 전달
  return done.ok ? { ok: true, url } : { ok: false, reason: done.reason };
}

/** 사진을 바꾼 결과 */
export type PhotoResult =
  | { ok: true; url: string | null }
  | {
      ok: false;
      reason: "bad-url" | Exclude<GatewayRename, { ok: true }>["reason"];
    };
