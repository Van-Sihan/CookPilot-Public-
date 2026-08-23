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

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";
import { Logo } from "@/components/brand";
import { Icon } from "@/components/icons";
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
};

export function HomeMe({ email }: Props) {
  /* 마이크를 누르면 데려갈 곳을 정해야 해서 길잡이를 받아 둔다 */
  const router = useRouter();

  /* 담아 둔 키. 없으면 요리를 시작할 수 없다 */
  const watchKey = useCallback(
    (fn: () => void) => watchSavedKey(browserApiKeyStore, fn),
    [],
  );
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
  const setup = useSyncExternalStore(
    watchSetup,
    () => browserCookSetupStore.load(),
    () => null,
  );

  /** 마이크를 눌렀을 때 갈 곳 */
  function onStart() {
    // 키가 없으면 요리를 시작할 수 없다. 키 넣는 화면으로 보낸다
    if (!key) {
      router.push("/start");
      return;
    }

    // 목소리를 아직 안 골랐으면 고르고 오게 하고, 골랐으면 바로 부엌으로
    router.push(setup ? "/pick" : "/start/model");
  }

  /* 화면에 보일 이름. 이메일에서 골뱅이 앞만 딴다 —
     남이 볼 화면은 아니지만 이메일을 통째로 띄워 둘 까닭도 없다 */
  const name = email ? email.split("@")[0] : "손님";

  return (
    <div className="hm-card">
      {/* 내가 누구인지 */}
      <div className="hm-who">
        {/* 아직 사진을 올리는 길이 없어서 로고를 세워 둔다 */}
        <span className="hm-face" aria-hidden="true">
          <Logo size={30} id="home-me" />
        </span>

        <span className="hm-name">
          <strong>{name}</strong>
          {/* 로그인했는지 아닌지가 한눈에 보여야 한다 */}
          <span className="hm-sub">{email ? "로그인됨" : "로그인하지 않음"}</span>
        </span>
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

      {/* 채비를 고치러 가는 길들. 단추보다 조용해야 한다 */}
      <p className="hm-links">
        {email && (
          <>
            <Link href="/account">닉네임 바꾸기</Link>
            <span aria-hidden="true"> · </span>
          </>
        )}
        <Link href="/start/model">목소리 바꾸기</Link>
        <span aria-hidden="true"> · </span>
        <Link href="/start">API 키</Link>
        {!email && (
          <>
            <span aria-hidden="true"> · </span>
            <Link href="/login">로그인</Link>
          </>
        )}
      </p>
    </div>
  );
}
