"use client";

/**
 * 홈(커뮤니티) 왼쪽 맨 위에 놓이는 내 자리.
 *
 * 여기서 하는 일은 둘이다 — 내가 누구인지 보여 주고, 요리를 시작하게 해 준다.
 *
 * 이 화면이 홈인 까닭에 요리로 들어가는 문이 여기 있어야 한다.
 * 마이크를 크게 두는 것은 그것이 이 서비스의 본체이기 때문이다 —
 * 글을 읽으러 왔다가도 한 번에 부엌으로 갈 수 있어야 한다.
 *
 * 목소리를 아직 안 골랐으면 고르는 화면으로, 골라 뒀으면 곧바로 요리로 보낸다.
 * 매번 목소리를 다시 고르게 하면 두 번째부터는 성가신 관문이 된다.
 */

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { avatarLetter } from "@/lib/domain/avatar";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { browserRecipeShelfStore } from "@/lib/adapter/browser-recipe-shelf-store";
import { maskApiKey } from "@/lib/domain/api-key";
import { findSavedKey, watchSavedKey } from "@/lib/usecase/enter-with-api-key";
import { countShelfBooks, watchShelf } from "@/lib/usecase/keep-recipe-shelf";
import { toneLabels } from "@/lib/cook-content";
import { voiceGenderLabels } from "@/lib/site-content";

type Props = {
  /** 로그인한 사람의 이메일. 서버가 알아내서 넘겨준다. 안 했으면 null */
  email: string | null;
  /** 남에게 보이는 이름. 아직 안 지었으면 null */
  name?: string | null;
  /** 프로필 사진 주소. 없으면 null */
  avatar?: string | null;
};

// [F1][함수] HomeMe({email, name, avatar}): 홈 왼쪽 맨 위 '내 자리' 카드
// 입력: email·name·avatar(서버가 읽어 넘긴 값) → 처리: 브라우저에 담긴 채비를 함께 보여 줌
// 출력: 화면(JSX)
export function HomeMe({ email, name: given, avatar }: Props) {
  /* 마이크를 누르면 데려갈 곳을 정해야 해서 길잡이를 받아 둔다 */
  const router = useRouter();

  /* 담아 둔 키. 없으면 요리를 시작할 수 없다 */
  // [F2][함수] watchKey(fn): 담아 둔 키가 바뀌는지 지켜보라고 부탁하는 함수
  const watchKey = useCallback(
    (fn: () => void) => watchSavedKey(browserApiKeyStore, fn),
    [],
  );
  // [F3][외부] ▷ useSyncExternalStore(watchKey, findSavedKey) → key
  const key = useSyncExternalStore(
    watchKey,
    () => findSavedKey(browserApiKeyStore),
    // 서버에는 저장 공간이 없으니 늘 "없음" 으로 본다
    () => null,
  );

  /* 서재에 몇 권 꽂혀 있는지 */
  const watchBooks = useCallback(
    (fn: () => void) => watchShelf(browserRecipeShelfStore, fn),
    [],
  );
  // [F4][외부] ▷ useSyncExternalStore(watchBooks, countShelfBooks) → books(권수)
  const books = useSyncExternalStore(
    watchBooks,
    () => countShelfBooks(browserRecipeShelfStore),
    () => 0,
  );

  /*
   * 골라 둔 목소리.
   *
   * 여기서는 "골랐는지 안 골랐는지" 가 중요하다. 기본값을 채워 주는 findCookSetup
   * 을 쓰면 안 고른 사람도 고른 것처럼 보여서, 목소리 고르는 화면을 영영 안 거친다.
   * 그래서 저장소를 직접 들여다본다.
   */
  const watchSetup = useCallback(
    (fn: () => void) => browserCookSetupStore.subscribe(fn),
    [],
  );
  // [F5][외부] ▷ useSyncExternalStore(watchSetup, store.load) → setup
  // findCookSetup 이 아니라 저장소를 직접 본다 — 기본값을 채우면 '안 골랐다' 를 못 가른다
  const setup = useSyncExternalStore(
    watchSetup,
    () => browserCookSetupStore.load(),
    () => null,
  );

  /** 마이크를 눌렀을 때 갈 곳 */
  // [F6][함수] onStart(): 마이크를 눌렀을 때 갈 곳을 정한다
  // 입력: key, setup → 처리: 셋 중 하나로 갈라 보냄 → 출력: 없음
  function onStart() {
    // 키가 없으면 요리를 시작할 수 없다. 키 넣는 화면으로 보낸다
    // [F7][분기] 키 없음 → true: ▷ router.push('/start') / false: F8
    if (!key) {
      router.push("/start");
      return;
    }

    // 목소리를 아직 안 골랐으면 고르고 오게 하고, 골랐으면 바로 부엌으로
    // [F8][분기] 목소리를 골랐나? [true] ▷ push('/pick') / [false] ▷ push('/start/model')
    router.push(setup ? "/pick" : "/start/model");
  }

  /* 화면에 보일 이름. 닉네임을 지었으면 그것을 쓴다 —
     커뮤니티에 그 이름으로 나가므로 여기서도 같아야 헷갈리지 않는다.
     아직 안 지었으면 이메일에서 골뱅이 앞만 딴다.
     이메일을 통째로 띄우지 않는 까닭은 옆 사람이 넘겨다볼 수 있어서다 */
  // [F9][흐름] 닉네임이 있으면 그것, 없으면 이메일 골뱅이 앞 → name
  const name = given || (email ? email.split("@")[0] : "손님");

  return (
    <div className="hm-card">
      {/* 내가 누구인지 */}
      <div className="hm-who">
        {/* 프로필 사진. 없으면 이름 첫 글자를 딴 동그란 표시로 대신한다 */}
        {avatar ? (
          <Image
            className="hm-face hm-face-img"
            src={avatar}
            alt=""
            width={38}
            height={38}
            /* 올릴 때 이미 256px 로 줄여 두어서 그대로 내보내도 된다 */
            unoptimized
          />
        ) : (
          <span className="hm-face" aria-hidden="true">
            {avatarLetter(name)}
          </span>
        )}

        <span className="hm-name">
          <strong>{name}</strong>
          {/* 로그인했는지 아닌지가 한눈에 보여야 한다 */}
          <span className="hm-sub">{email ? "로그인됨" : "로그인하지 않음"}</span>
        </span>

        {/* 계정 설정. 닉네임·사진·목소리·API 키가 모두 이 안에 있다.
            전에는 카드 밑에 작은 링크 셋으로 흩어져 있었는데,
            자주 쓰지 않는 것들이 늘 자리를 차지하고 있었다 */}
        {email && (
          <Link className="hm-gear" href="/account" aria-label="계정 설정" title="계정 설정">
            <Icon name="gear" size={18} />
          </Link>
        )}
      </div>

      {/* 이 화면의 주인공. 누르면 부엌으로 간다 */}
      <button className="hm-mic" type="button" onClick={onStart}>
        <span className="hm-mic-ring" aria-hidden="true">
          <Icon name="mic" size={30} />
        </span>
        <span className="hm-mic-t">
          {/* 무엇이 일어날지 미리 알려 준다 */}
          <strong>말로 요리 시작</strong>
          <span className="hm-sub">
            {!key
              ? "먼저 API 키를 넣어야 합니다"
              : setup
                ? "누르고 만들 요리를 말하세요"
                : "목소리를 먼저 고릅니다"}
          </span>
        </span>
      </button>

      {/* 지금 어떤 채비인지 한눈에 */}
      <dl className="hm-facts">
        <div>
          <dt>목소리</dt>
          <dd>
            {setup
              ? `${voiceGenderLabels[setup.gender]} · ${toneLabels[setup.tone]}`
              : "아직 안 고름"}
          </dd>
        </div>

        <div>
          <dt>서재</dt>
          {/* 숫자만 보여 주고 갈 데가 없으면 답답하다. 눌러서 바로 열리게 한다 */}
          <dd>
            <Link className="hm-shelf" href="/shelf">
              {books}권 보기
            </Link>
          </dd>
        </div>

        <div>
          <dt>API 키</dt>
          {/* 키를 통째로 띄우지 않는다. 옆 사람이 넘겨다볼 수 있다 */}
          <dd>{key ? maskApiKey(key) : "없음"}</dd>
        </div>
      </dl>

      {/* 글쓰기. 로그인한 사람에게만 보인다 — 안 한 사람에게 보여 줘도
          누르는 순간 로그인 화면으로 튕긴다 */}
      {email && (
        <Link className="hm-write" href="/write">
          <span className="hm-write-ico" aria-hidden="true">
            <Icon name="spark" size={17} />
          </span>
          글쓰기
        </Link>
      )}

      {/* 로그인 안 한 사람에게만 남는 길. 로그인한 사람의 채비는
          위 톱니바퀴(계정 설정) 안으로 들어갔다 */}
      {!email && (
        <p className="hm-links">
          <Link href="/login">로그인</Link>
          <span aria-hidden="true"> · </span>
          <Link href="/start">API 키 넣기</Link>
        </p>
      )}
    </div>
  );
}
