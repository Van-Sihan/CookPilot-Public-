"use client";

/**
 * 준비 단계의 두 번째 화면 — 안내 목소리와 답변 속도를 골라 두는 카드 묶음.
 *
 * 목소리를 알아듣는 모델은 고를 수 없어서 여기 안 나온다. 실시간으로 말을
 * 주고받는 모델이 지금은 하나뿐이라, 선택지가 하나뿐인 물음을 던지는 셈이 된다.
 * 그래서 사람이 고르는 것은 "성별", "말투", "얼마나 꼼꼼히" 셋이다.
 *
 * 미리 듣기는 **요리할 때 실제로 들릴 그 목소리**로 들려준다.
 * 브라우저에 딸린 읽어 주기로 대신하면, 골라 놓고 정작 다른 목소리가 나온다.
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { browserCookSetupStore } from "@/lib/adapter/browser-cook-setup-store";
import { previewVoice } from "@/lib/adapter/gemini-live-gateway";
import { openSpeaker, type Speaker } from "@/lib/adapter/browser-audio";
import { DEFAULT_SPEED, type AnswerSpeed } from "@/lib/domain/gemini-model";
import {
  DEFAULT_GENDER,
  DEFAULT_TONE,
  voiceGenders,
  type VoiceGender,
  type VoiceTone,
} from "@/lib/domain/voice-tone";
import { findSavedKey } from "@/lib/usecase/enter-with-api-key";
import { keepCookSetup } from "@/lib/usecase/choose-cook-setup";
import {
  answerSpeedCards,
  setupCopy,
  voiceGenderLabels,
  voiceToneCards,
} from "@/lib/site-content";

/** 카드 밑을 받치는 물결의 막대 수. 시안처럼 잔잔해 보이려면 막대가 많아야 한다 */
const TONE_BARS = 26;

/**
 * 막대 높이(0~1).
 *
 * `Math.random()` 을 쓰지 않는다. 서버가 그린 화면과 브라우저가 그린 첫 화면의
 * 막대 높이가 다르면 React 가 "내용이 어긋난다" 고 화를 낸다.
 */
function toneBarHeight(i: number): number {
  const wobble = Math.abs(Math.sin(i * 0.9));
  const hill = 0.45 + 0.55 * Math.cos((i / (TONE_BARS - 1) - 0.5) * Math.PI);
  return 0.18 + 0.82 * wobble * hill;
}

/** 막대 높이를 미리 다 구해 둔다. 카드 세 장이 같은 물결을 쓴다 */
const TONE_WAVE = Array.from({ length: TONE_BARS }, (_, i) => toneBarHeight(i));

export function SetupPicker() {
  /* 다 고르고 나면 음성 화면으로 데려가야 해서 길잡이를 받아 둔다 */
  const router = useRouter();

  /* 지금 고른 성별 */
  const [gender, setGender] = useState<VoiceGender>(DEFAULT_GENDER);

  /* 지금 고른 말투 */
  const [tone, setTone] = useState<VoiceTone>(DEFAULT_TONE);

  /* 지금 고른 답변 속도 */
  const [speed, setSpeed] = useState<AnswerSpeed>(DEFAULT_SPEED);

  /* 지금 미리 듣는 중인 말투. 없으면 null */
  const [playing, setPlaying] = useState<VoiceTone | null>(null);

  /* 담아 두지 못했거나 미리 듣기가 안 됐을 때 띄우는 안내 */
  const [warn, setWarn] = useState<string | null>(null);

  /* 미리 듣기를 도중에 끊는 손잡이와, 소리를 낼 스피커 */
  const stopRef = useRef<(() => void) | null>(null);
  const speakerRef = useRef<Speaker | null>(null);

  /** 미리 듣던 것을 끊고 치운다 */
  const stopPreview = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;

    speakerRef.current?.cut();
    speakerRef.current?.close();
    speakerRef.current = null;

    setPlaying(null);
  }, []);

  /* 화면을 떠날 때 소리가 남지 않게 한다 */
  useEffect(() => stopPreview, [stopPreview]);

  /* 고른 속도에 붙는 설명. 아래 문단이 이 값을 보고 바뀐다 */
  const speedNote = answerSpeedCards.find((s) => s.id === speed)?.note;

  /** 이 말투를 실제 목소리로 들려준다 */
  function listen(next: VoiceTone) {
    /* 앞서 듣던 것을 먼저 끊는다. 안 끊으면 두 목소리가 겹쳐서 들린다 */
    stopPreview();

    setWarn(null);

    const key = findSavedKey(browserApiKeyStore);
    if (!key) {
      setWarn("API 키가 없어 미리 들을 수 없습니다. 시작 화면에서 키를 먼저 넣어 주세요.");
      return;
    }

    // 이 말투의 예문을 읽힌다
    const line = voiceToneCards.find((c) => c.id === next)?.line ?? "";

    const speaker = openSpeaker();
    speakerRef.current = speaker;

    /* 사람이 단추를 눌러서 여기 왔으므로 브라우저가 소리를 막지 않는다.
       그래도 혹시 모르니 한 번 풀어 준다 */
    void speaker.unblock();

    setPlaying(next);

    stopRef.current = previewVoice(
      key,
      gender,
      next,
      line,
      (pcm) => speaker.push(pcm),
      (problem) => {
        // 다 읽었거나 실패했다. 어느 쪽이든 단추를 되돌린다
        setPlaying(null);

        if (problem === "key") setWarn("API 키가 거절되었습니다. 키를 다시 넣어 주세요.");
        else if (problem) setWarn("미리 듣기를 가져오지 못했습니다. 잠시 뒤에 다시 눌러 보세요.");
      },
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    /* 가만두면 브라우저가 페이지를 통째로 새로 고쳐 버린다 */
    e.preventDefault();

    // 넘어가면서 소리가 따라가면 안 된다
    stopPreview();

    /* 담아 두는 일은 통째로 유스케이스에 맡긴다 */
    const kept = keepCookSetup({ gender, tone, speed }, browserCookSetupStore);

    /* 못 담았어도 요리는 할 수 있다. 다음에 다시 골라야 한다는 것만 알려 준다 */
    if (!kept) {
      setWarn("이 브라우저가 저장을 막고 있어, 고르신 설정이 이번 방문에만 남습니다.");
    }

    /* 담았든 못 담았든 다음 화면으로 넘어간다 */
    router.push("/pick");
  }

  return (
    // 브라우저가 제멋대로 검사하지 않게 막는다
    <form className="setup-form" onSubmit={onSubmit} noValidate>
      {/* 성별부터 고른다. 이걸 바꾸면 아래 세 카드가 모두 다른 목소리가 된다 */}
      <fieldset className="setup-gender">
        <legend className="setup-speed-label">{setupCopy.genderLabel}</legend>

        <div className="seg">
          {voiceGenders.map((g) => (
            <label className="seg-item" key={g} data-on={gender === g ? "" : undefined}>
              <input
                type="radio"
                name="gender"
                className="sr-only"
                checked={gender === g}
                /* 성별이 바뀌면 듣던 것을 끊는다. 안 끊으면 방금 고른 성별과
                   다른 목소리가 계속 흘러나온다 */
                onChange={() => {
                  stopPreview();
                  setGender(g);
                }}
              />
              {voiceGenderLabels[g]} 목소리
            </label>
          ))}
        </div>
      </fieldset>

      {/* 말투 카드 세 장 */}
      <fieldset className="setup-tones">
        {/* 묶음 이름은 위쪽 큰 물음이 이미 하고 있어서 눈에는 안 보이게 둔다 */}
        <legend className="sr-only">안내 목소리 말투</legend>

        {voiceToneCards.map((card) => (
          // 카드 전체가 이름표라서 어디를 눌러도 골라진다
          <label className="tone" key={card.id} data-on={tone === card.id ? "" : undefined}>
            <input
              type="radio"
              name="tone"
              className="sr-only"
              checked={tone === card.id}
              /* 고르면 곧바로 들려준다. 고르고 나서 또 단추를 찾게 하면
                 세 개를 견줘 보는 데 손이 여섯 번 간다 */
              onChange={() => {
                setTone(card.id);
                listen(card.id);
              }}
            />

            {/* 카드 윗줄 — 그림, 이름, 고름 표시 */}
            <span className="tone-head">
              <span className="tone-ico" aria-hidden="true">
                <Icon name="flame" size={17} />
              </span>

              <span className="tone-who">
                <span className="tone-name">{card.name} 목소리</span>
                <span className="tone-sub">{card.sub}</span>
              </span>

              <span className="tone-dot" aria-hidden="true" />
            </span>

            {/* 이 말투면 어떻게 들리는지 보여 주는 예문 */}
            <span className="tone-line">“{card.line}”</span>

            {/* 카드 밑을 받치는 물결. 듣는 중에는 일렁인다 */}
            <span
              className="tone-wave"
              aria-hidden="true"
              data-playing={playing === card.id ? "" : undefined}
            >
              {TONE_WAVE.map((h, i) => (
                <span
                  key={i}
                  style={
                    {
                      "--h": String(h),
                      "--d": (i * 0.045).toFixed(3) + "s",
                    } as React.CSSProperties
                  }
                />
              ))}
            </span>

            {/* 다시 듣고 싶을 때. 카드를 이미 골라 둔 상태에서도 눌러야 하므로 따로 둔다 */}
            <button
              className="tone-listen"
              type="button"
              /* 카드가 이름표라 이 단추를 누르면 라디오까지 눌린다. 그건 그대로 두고
                 (어차피 이 카드를 고르려는 것이니) 듣기만 한 번 더 시킨다 */
              onClick={(e) => {
                e.preventDefault();
                setTone(card.id);
                listen(card.id);
              }}
            >
              <Icon name="play" size={15} />
              {playing === card.id ? setupCopy.listening : setupCopy.listen}
            </button>
          </label>
        ))}
      </fieldset>

      {/* 이 화면에서 진짜 해야 할 일 — 고르고 넘어가기 */}
      <button className="btn btn-fill setup-go" type="submit">
        {setupCopy.go}
        <span className="setup-go-ico" aria-hidden="true">
          <Icon name="flame" size={17} />
        </span>
      </button>

      {/* 답변 속도 — 여기서 고른 값이 곧 어떤 모델을 부를지를 정한다 */}
      <fieldset className="setup-speed">
        <legend className="setup-speed-label">{setupCopy.speedLabel}</legend>

        <div className="seg">
          {answerSpeedCards.map((card) => (
            <label className="seg-item" key={card.id} data-on={speed === card.id ? "" : undefined}>
              <input
                type="radio"
                name="speed"
                className="sr-only"
                checked={speed === card.id}
                onChange={() => setSpeed(card.id)}
              />
              {card.name}
            </label>
          ))}
        </div>

        {/* 고른 쪽이 어떤 성질인지 */}
        <p className="setup-speed-note">{speedNote}</p>
      </fieldset>

      {/* 아직 못 만든 것을 미리 알려 두는 알약 */}
      <p className="setup-badge">
        <span className="setup-badge-ico" aria-hidden="true">
          <Icon name="book" size={15} />
        </span>
        {setupCopy.badge}
      </p>

      {/* 잘못됐을 때만 나오는 안내 */}
      {warn && (
        <p className="setup-warn" role="status">
          {warn}
        </p>
      )}

      {/* 맨 아랫줄 */}
      <p className="setup-foot">
        {setupCopy.foot}
        <span aria-hidden="true"> · </span>
        <span className="setup-foot-hot">{setupCopy.footHot}</span>
      </p>
    </form>
  );
}
