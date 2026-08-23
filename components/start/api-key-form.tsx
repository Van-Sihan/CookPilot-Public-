"use client";

/**
 * 시작 화면의 키 입력 카드. 이 페이지에서 브라우저가 직접 움직이는 부분은 여기뿐이다.
 *
 * 키를 어떻게 검사하는지, 어디에 담아 두는지는 여기 하나도 안 적혀 있다.
 * 유스케이스를 한 번 부르고, 그 대답에 따라 화면만 갈아 끼운다.
 */

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { maskApiKey, type ApiKey } from "@/lib/domain/api-key";
import {
  enterWithApiKey,
  findSavedKey,
  forgetSavedKey,
  watchSavedKey,
} from "@/lib/usecase/enter-with-api-key";
import { apiKeyMessages, apiKeyPlaceholder } from "@/lib/site-content";

export function ApiKeyForm() {
  /* 입력칸에 지금 적혀 있는 글자. 이 값은 이 카드가 직접 들고 있는다 */
  const [raw, setRaw] = useState("");

  /* 키를 눈에 보이게 할지 말지. 제대로 붙여 넣었는지 눈으로 볼 방법은 있어야 하니까 */
  const [shown, setShown] = useState(false);

  /* 키를 돌려보냈을 때 입력칸 밑에 띄울 말. 할 말이 없으면 null */
  const [message, setMessage] = useState<string | null>(null);

  /* 저장된 키가 바뀌면 알려 달라고 부탁하는 함수.
     화면을 다시 그릴 때마다 이 함수가 새로 만들어지면, 부탁했다 취소했다를 끝없이 되풀이한다.
     그래서 한 번 만든 것을 계속 붙들고 쓴다 */
  const subscribe = useCallback(
    (onChange: () => void) => watchSavedKey(browserApiKeyStore, onChange),
    [],
  );

  /*
   * 이미 담아 둔 키. 이 값은 React 바깥(브라우저 저장 공간)에 있어서
   * 보통 쓰는 useState 로는 못 따라간다. 그래서 "바깥 값 지켜보기" 도구를 쓴다.
   * 서버에서 그릴 때는 늘 "없음" 이라고 답하게 해 두었다.
   * 그래야 서버가 그린 화면과 브라우저가 그린 첫 화면이 서로 어긋나지 않는다.
   */
  const saved = useSyncExternalStore<ApiKey | null>(
    // 값이 바뀌면 알려 달라고 부탁하는 길
    subscribe,
    // 브라우저에서 지금 값이 뭔지 읽어 오는 방법
    () => findSavedKey(browserApiKeyStore),
    // 서버에서 그릴 때 쓸 값. 서버에는 저장 공간이 없으니 늘 "없음" 으로 본다
    () => null,
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    /* 가만두면 브라우저가 페이지를 통째로 새로 고쳐 버린다. 그걸 막는다 */
    e.preventDefault();

    /* 검사하고 담아 두는 일은 통째로 유스케이스에 맡긴다 */
    const result = enterWithApiKey(raw, browserApiKeyStore);

    // 안 됐으면 화면은 그대로 두고 까닭만 알려 준다
    if (!result.ok) {
      /* 돌아온 까닭을 사람이 읽을 수 있는 말로 바꿔서 보여 준다 */
      setMessage(apiKeyMessages[result.reason]);
      return;
    }

    /* 잘됐으니 아까 띄워 둔 잔소리를 치우고 */
    setMessage(null);

    /* 입력칸에 키가 그대로 남아 있으면 위험하니 비운다 */
    setRaw("");

    /* 카드가 "키 저장됨" 모습으로 바뀌는 건, 위에서 지켜보라고 해 둔 쪽이 알아서 한다 */
  }

  function onChangeKey() {
    /* 담아 둔 키를 버리면 입력칸이 다시 나온다 */
    forgetSavedKey(browserApiKeyStore);
    // 새 키를 넣을 때는 가려진 채로 시작하는 게 안전하다
    setShown(false);
  }

  /* 처음엔 늘 입력칸이 보이고, 담아 둔 키를 읽어 오면 그때 모습이 바뀐다 */
  const hasSaved = saved !== null;

  return (
    <div className="start-card">
      {/* 카드 제목 */}
      <h2 className="start-card-title">
        {/* 제목 앞의 작은 불티. 무슨 뜻인지는 옆 글씨가 알려 주니 숨긴다 */}
        <span className="start-card-ico" aria-hidden="true">
          {/* 제목 옆이라 20픽셀로 줄여서 그린다 */}
          <Icon name="spark" size={20} />
        </span>
        시작하기
      </h2>

      {/* 담아 둔 키가 있으면 입력칸 대신 지금 어떤 상태인지를 보여 준다 */}
      {hasSaved ? (
        <>
          {/* 다음에 또 넣지 않아도 된다는 걸 알려 준다 */}
          <p className="start-card-lead">
            키가 이 브라우저에 저장되어 있습니다. 다음에 오실 때는 이 단계를 건너뜁니다.
          </p>

          {/* "그 키구나" 하고 알아볼 만큼만 보여 주고 가운데는 점으로 덮는다 */}
          <p className="start-saved">
            {/* 잘 되고 있다는 뜻의 초록 점. 꾸미기용이라 숨긴다 */}
            <span className="start-saved-dot" aria-hidden="true" />
            {maskApiKey(saved)}
          </p>

          {/* 키를 넣었으면 홈으로 보낸다. 홈에서 마이크를 누르면 요리로 이어진다 —
              키 화면에서 곧바로 목소리 고르기로 몰아넣으면, 둘러볼 틈 없이
              관문만 이어지는 꼴이 된다.
              단추처럼 보이지만 실제로는 링크다 — 새 탭으로 열거나 주소를 복사할 수 있어야 한다 */}
          <Link className="btn btn-fill start-go" href="/community">
            홈으로 가기
          </Link>

          {/* 곧바로 요리부터 하고 싶은 사람을 위한 지름길 */}
          <Link className="start-change" href="/start/model">
            바로 요리 시작하기 →
          </Link>

          {/* 다른 키로 바꾸는 길. 단추처럼 크게 두면 헷갈려서 글씨처럼 작게 둔다 */}
          <button className="start-change" type="button" onClick={onChangeKey}>
            다른 키로 바꾸기
          </button>
        </>
      ) : (
        // 브라우저가 제멋대로 검사하지 않게 막는다. 검사는 우리가 정한 규칙으로만 한다
        <form onSubmit={onSubmit} noValidate>
          {/* 왜 자기 키를 넣어야 하는지 짧게 알려 준다 */}
          <p className="start-card-lead">
            구글 Gemini 키를 넣으면 바로 쓸 수 있습니다. 각자 자기 키를 쓰는 방식이라
            다른 사람의 사용량과 섞이지 않습니다.
          </p>

          {/* 입력칸과 눈 모양 단추를 겹쳐 놓는 자리 */}
          <div className="start-field">
            {/* 이름표를 눈에는 안 보이게 숨긴다. 대신 읽어 주는 기계는 읽을 수 있게 남겨 둔다 */}
            <label className="sr-only" htmlFor="api-key">
              구글 Gemini API 키
            </label>

            <input
              // 바로 위 이름표와 짝을 맞추는 이름
              id="api-key"
              className="start-input"
              /* 눈 단추를 누르기 전까지는 옆에서 못 보게 점으로 덮어 둔다 */
              type={shown ? "text" : "password"}
              // 적힌 글자를 위쪽 값이 쥐고 있다. 그래서 화면에 보이는 것과 실제 값이 어긋날 일이 없다
              value={raw}
              /* 다시 적기 시작하면 아까 띄운 잔소리는 치워 준다 */
              onChange={(e) => {
                setRaw(e.target.value);
                setMessage(null);
              }}
              // 어떻게 생긴 값을 넣으면 되는지 흐리게 보여 주는 예시
              placeholder={apiKeyPlaceholder}
              /* 키는 자동완성이나 맞춤법 검사를 하면 안 되는 값이다 */
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              /* 잘못됐을 때 읽어 주는 기계가 아래 잔소리도 같이 읽도록 이어 준다 */
              aria-invalid={message !== null}
              aria-describedby={message ? "api-key-error" : undefined}
            />

            <button
              className="start-peek"
              // 폼 안에 있는 단추는 가만두면 폼을 보내 버린다. 그래서 "그냥 단추" 라고 못 박는다
              type="button"
              // 보임·가림을 뒤집는다. 바로 앞 값을 받아서 뒤집어야 빨리 여러 번 눌러도 안 꼬인다
              onClick={() => setShown((v) => !v)}
              // 그림만 있는 단추라 지금 상태에 맞는 이름을 붙여 준다
              aria-label={shown ? "키 가리기" : "키 보기"}
              // 지금 눌러 둔 상태인지를 읽어 주는 기계에 알려 준다
              aria-pressed={shown}
            >
              {/* 지금 보이는 중이면 "가리기" 그림을, 가려져 있으면 "보기" 그림을 준다 */}
              <Icon name={shown ? "eye-off" : "eye"} size={20} />
            </button>
          </div>

          {/* 이렇게 표시해 두면 잔소리가 나타나는 순간 읽어 주는 기계가 바로 알려 준다 */}
          {message && (
            // 위 입력칸이 "설명은 여기 있어요" 하고 가리키는 이름
            <p className="start-error" id="api-key-error" role="alert">
              {message}
            </p>
          )}

          {/* 폼을 보내는 단추. 누르면 위에 적어 둔 onSubmit 이 움직인다 */}
          <button className="btn btn-fill start-go" type="submit">
            들어가기
          </button>
        </form>
      )}

    </div>
  );
}
