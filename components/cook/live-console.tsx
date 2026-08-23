"use client";

/**
 * 요리 화면의 마이크 자리 — 제미나이 라이브와 말을 주고받는 곳.
 *
 * 흐름은 이렇다.
 *   마이크 → PCM 조각 → 라이브 게이트웨이 → 안내 목소리 조각 → 스피커
 *   그와 별도로 오간 말이 글로도 와서, 화면에 쌓이고 명령을 걸러 낸다.
 *
 * 이 화면에 들어오면 **알아서 마이크가 켜지고 지금 걸음을 읽어 준다.**
 * 손이 젖은 채로 단추를 찾는 것이 이 앱이 없애려는 바로 그 수고이기 때문이다.
 *
 * 웹소켓도 오디오도 여기서는 안 만진다. 어댑터가 다 하고 이 파일은 이어 붙이기만 한다.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { browserApiKeyStore } from "@/lib/adapter/browser-api-key-store";
import { geminiLiveGateway } from "@/lib/adapter/gemini-live-gateway";
import { openMic, openSpeaker, type Mic, type Speaker } from "@/lib/adapter/browser-audio";
import { readStepCommand, readTimerRequest, type StepCommand } from "@/lib/domain/cook-progress";
import type { Recipe } from "@/lib/domain/recipe";
import type { VoiceGender, VoiceTone } from "@/lib/domain/voice-tone";
import { findSavedKey } from "@/lib/usecase/enter-with-api-key";
import { readStepNote, type CookSaid, type LiveSession } from "@/lib/usecase/cook-along";
import { cookCopy, liveMessages } from "@/lib/cook-content";

/** 막대 개수. 요리 화면은 자리가 좁아서 고르기 화면보다 적게 둔다 */
const BAR_COUNT = 29;

/** 한가운데 막대의 자리 */
const MID = (BAR_COUNT - 1) / 2;

/** 소리가 없을 때 막대가 서 있는 높이. 고르기 화면과 같은 셈이다 */
const IDLE = Array.from({ length: BAR_COUNT }, (_, i) => {
  const away = Math.abs(i - MID) / MID;
  return Math.max(0.08, Math.cos((away * Math.PI) / 2) * (0.55 + 0.45 * Math.abs(Math.sin(i * 2.399))));
});

type Props = {
  /** 지금 만드는 레시피. 말동무에게 통째로 알려 준다 */
  recipe: Recipe;
  /** 어떤 성별의 목소리로 */
  gender: VoiceGender;
  /** 어떤 말투로 안내할지 */
  tone: VoiceTone;
  /** 지금 몇 번째 걸음인지. 바뀌면 그 걸음을 읽어 준다 */
  stepIndex: number;
  /** 말이 오갈 때마다 껍데기에 올려 보낸다 */
  onSaid: (said: CookSaid) => void;
  /** 말로 타이머를 걸어 달라고 했을 때 */
  onTimer: (label: string, minutes: number) => void;
  /** 말로 "다음"·"이전"·"다시" 라고 했을 때 */
  onCommand: (cmd: StepCommand) => void;
  /**
   * 말동무에게 글로 한마디 건네는 길을 껍데기에 넘겨준다.
   * 껍데기의 "이 걸음 읽어 주기" 단추가 이걸 쓴다 — 이어져 있으면 같은 목소리로 읽고,
   * 안 이어져 있으면 브라우저 읽어 주기로 넘어간다.
   */
  onReady: (say: ((text: string) => void) | null) => void;
};

// [F1][함수] LiveConsole({recipe, gender, tone, stepIndex, onSaid, onTimer, onCommand, onReady})
// 요리 화면의 마이크 자리 — 제미나이 라이브와 말을 주고받는다
// 입력: 레시피·목소리·지금 걸음 + 껍데기가 준 손잡이 넷 → 출력: 화면(JSX)
// 흐름: 마이크 → PCM → 게이트웨이 → 안내 목소리 → 스피커 (글로도 와서 명령을 걸러 낸다)
export function LiveConsole({
  recipe,
  gender,
  tone,
  stepIndex,
  onSaid,
  onTimer,
  onCommand,
  onReady,
}: Props) {
  /* 지금 어떤 상태인지. 단추 모습과 안내 글이 이 값을 보고 바뀐다 */
  // [F2][흐름] 지금 상태 → phase / 잔소리 → error / 소리가 막혔는지 → muted
  const [phase, setPhase] = useState<"off" | "opening" | "live">("off");

  /* 잘못됐을 때 띄우는 말 */
  const [error, setError] = useState<string | null>(null);

  /* 스피커가 막혀 있는지. 막혀 있으면 "소리 켜기" 단추를 띄운다 */
  const [muted, setMuted] = useState(false);

  /* 막대를 가리키는 손잡이들 */
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);

  /* 지금 열려 있는 것들. 끌 때 다 거둬야 한다 */
  // [F3][흐름] 열어 둔 것들 → micRef · speakerRef · sessionRef · frameRef (끌 때 다 거둔다)
  const micRef = useRef<Mic | null>(null);
  const speakerRef = useRef<Speaker | null>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const frameRef = useRef(0);

  /* 이 화면에 들어와서 한 번이라도 말동무를 불러 봤는지.
     React 는 개발 중에 효과를 두 번 돌려 보는데, 그때 웹소켓이 두 개 열리면
     같은 말이 두 번 들린다 */
  // [F4][흐름] 한 번이라도 불러 봤는지 → triedRef (개발 중 효과가 두 번 돌 때 웹소켓이 두 개 열린다)
  const triedRef = useRef(false);

  /* 껍데기가 넘겨준 손들. 그리는 도중이 아니라 그린 뒤에 담는다 */
  // [F5][흐름] 껍데기가 준 손잡이들 → handsRef (그리는 도중이 아니라 그린 뒤에 담는다)
  const handsRef = useRef({ onSaid, onTimer, onCommand, onReady });
  useEffect(() => {
    handsRef.current = { onSaid, onTimer, onCommand, onReady };
  }, [onSaid, onTimer, onCommand, onReady]);

  /* 지금 걸음을 늘 최신으로 들고 있는다.
     말동무를 부르는 함수는 한 번만 만들어지는데, 그 안에서 stepIndex 를 그대로 쓰면
     불렀을 때의 값이 박제되어 첫 걸음만 계속 읽는다 */
  // [F6][흐름] 지금 걸음 → stepRef / 걸음 목록 → stepsRef
  // start 는 한 번만 만들어지므로 값을 그대로 가두면 첫 걸음만 계속 읽는다
  const stepRef = useRef(stepIndex);
  useEffect(() => {
    stepRef.current = stepIndex;
  }, [stepIndex]);

  /* 걸음 목록도 같은 까닭으로 늘 최신을 들고 있는다 */
  const stepsRef = useRef(recipe.steps);
  useEffect(() => {
    stepsRef.current = recipe.steps;
  }, [recipe.steps]);

  /** 걸어 둔 것을 모두 거둔다 */
  // [F7][함수] stop(): 걸어 둔 것을 모두 거둔다
  // 입력: 없음 → 처리: 세션 닫기 → 마이크 놓기 → 스피커 닫기 → 출력: 없음
  // 차례가 중요하다 — 보내는 쪽을 먼저 끊어야 한다
  const stop = useCallback(() => {
    cancelAnimationFrame(frameRef.current);

    // 차례가 중요하다 — 보내는 쪽을 먼저 끊고, 마이크를 놓고, 스피커를 닫는다
    sessionRef.current?.close();
    sessionRef.current = null;

    micRef.current?.stop();
    micRef.current = null;

    speakerRef.current?.close();
    speakerRef.current = null;

    // 껍데기가 들고 있던 길도 끊어 준다
    handsRef.current.onReady(null);

    setPhase("off");
    setMuted(false);

    // 막대를 기본 모습으로 되돌린다
    barsRef.current.forEach((el, i) => el?.style.setProperty("--h", String(IDLE[i])));
  }, []);

  /**
   * 사람이 한 말에서 명령을 찾아 처리한다.
   *
   * 사람이 한 말에서만 찾는다. 안내가 "3분 볶으세요" 라고 한 것까지 타이머로 걸면
   * 시키지도 않은 알람이 계속 울린다.
   */
  // [F8][함수] handleHeard(text): 사람이 한 말에서 명령을 찾아 처리한다
  // 입력: text(사람이 한 말) → 처리: readStepCommand + readTimerRequest → 출력: 없음
  // **사람이 한 말에서만** 찾는다. 안내가 '3분 볶으세요' 라고 한 것까지 타이머로 걸면 안 된다
  const handleHeard = useCallback(
    (text: string) => {
      // [F9][호출] text → readStepCommand(domain/cook-progress:F20) → cmd
      const cmd = readStepCommand(text);

      // [F10][분기] cmd 가 있음 → speaker.cut() 으로 모델의 군말을 끊고
      // 'repeat' 이면 여기서 다시 읽히고, 'next'·'prev' 면 껍데기의 onCommand 로 올려 보낸다
      if (cmd) {
        /* 모델이 이 명령에 스스로 대꾸하고 있을 수 있다. 시키지 않은 그 말을
           끊어야 곧 이어질 걸음 읽기와 겹치지 않는다 */
        speakerRef.current?.cut();

        if (cmd === "repeat") {
          /* "다시" 는 걸음을 안 옮긴다. 껍데기까지 갈 것 없이 여기서
             지금 걸음을 한 번 더 읽어 달라고 시킨다 */
          sessionRef.current?.say(
            readStepNote(
              stepRef.current,
              stepsRef.current.length,
              stepsRef.current[stepRef.current]?.text ?? "",
            ),
          );
        } else {
          // "다음"·"이전" 은 껍데기가 걸음을 옮기고, 그러면 아래 효과가 읽어 준다
          handsRef.current.onCommand(cmd);
        }
      }

      // "3분 타이머해줘"
      // [F11][호출] text → readTimerRequest(domain/cook-progress:F10) → minutes
      // [F11][분기] minutes 가 있으면 → onTimer('말로 건 타이머', minutes) → cook-shell 의 addAlarm
      const minutes = readTimerRequest(text);
      if (minutes) handsRef.current.onTimer("말로 건 타이머", minutes);
    },
    [],
  );

  /** 말동무를 부른다 */
  // [F12][함수] start(): 말동무를 부른다
  // 입력: 없음 → 처리: 키 확인 → 마이크 → 스피커 → 웹소켓 → 첫 걸음 읽기 → 막대 그리기
  // 출력: 없음(비동기)
  const start = useCallback(async () => {
    setError(null);

    // 키가 없으면 이어질 데가 없다
    // [F13][호출] findSavedKey(usecase:F7) → key. 없으면 안내를 띄우고 멈춘다
    const key = findSavedKey(browserApiKeyStore);
    if (!key) {
      setError("API 키가 없습니다. 시작 화면에서 먼저 키를 넣어 주세요.");
      return;
    }

    setPhase("opening");

    // 마이크부터 연다. 여기서 막히면 말동무를 불러 봐야 소용없다
    // [F14][외부] ▷ openMic(browser-audio:F2) → opened. 못 열면 까닭을 띄우고 멈춘다
    const opened = await openMic();
    if (!opened.ok) {
      setPhase("off");
      setError(liveMessages[opened.problem]);
      return;
    }
    micRef.current = opened.mic;

    // 안내 목소리를 낼 스피커
    // [F15][외부] ▷ openSpeaker(browser-audio:F19) → speaker → unblock() 으로 소리를 풀어 본다
    const speaker = openSpeaker();
    speakerRef.current = speaker;

    /* 이 화면에 들어오자마자 자동으로 켜기 때문에, 사람이 아직 아무것도 안 눌렀을 수 있다.
       그러면 브라우저가 소리를 막는다. 막혔으면 "소리 켜기" 단추를 띄운다 */
    void speaker.unblock().then((ok) => setMuted(!ok));

    let session: LiveSession;
    try {
      // [F16][외부] {recipe, gender, tone} ▷ geminiLiveGateway(key).open(gemini-live-gateway:F2)
      // 콜백으로 오는 것: 'open' → phase / 'audio' → speaker.push / 'interrupted' → speaker.cut
      // 'said' → onSaid + (사람 말이면) handleHeard(F8) / 'closed' → 까닭을 띄우고 stop(F7)
      session = await geminiLiveGateway(key).open({ recipe, gender, tone }, (e) => {
        // 이어졌다
        if (e.kind === "open") setPhase("live");

        // 안내 목소리 한 조각. 스피커가 줄을 세워 이어 튼다
        if (e.kind === "audio") speakerRef.current?.push(e.pcm);

        /* 사람이 말을 끊었다. 틀던 소리를 버리지 않으면 새 대답과 겹쳐서
           둘이 동시에 말하는 것처럼 들린다 */
        if (e.kind === "interrupted") speakerRef.current?.cut();

        if (e.kind === "said") {
          // 화면의 "주고받은 말" 에 쌓는다
          handsRef.current.onSaid(e.said);

          /* 사람이 한 말에서만 명령을 찾는다. 말끝을 언제로 볼지는 게이트웨이가
             정해서 넘겨준다 — 모아 두는 자리가 거기라 거기서 자르는 것이 맞다 */
          if (e.said.who === "me") handleHeard(e.said.text);
        }

        // 끊겼다. 까닭이 있으면 알려 준다
        if (e.kind === "closed") {
          if (e.problem && e.problem !== "closed") setError(liveMessages[e.problem]);
          stop();
        }
      });
    } catch {
      // 못 이었다. 마이크와 스피커를 도로 놓아 준다
      stop();
      setError(liveMessages.unreachable);
      return;
    }

    sessionRef.current = session;

    // 껍데기가 글로 한마디 건넬 수 있게 길을 넘겨준다
    // [F17][호출] onReady(say) → cook-shell 의 sayRef 에 담긴다(스피커 단추가 이 길을 쓴다)
    handsRef.current.onReady((text: string) => session.say(text));

    // 마이크 조각이 올 때마다 그대로 흘려보낸다
    // [F18][반복] 마이크 조각이 올 때마다 ▷ session.send(pcm) 으로 흘려보낸다
    opened.mic.onChunk((pcm) => session.send(pcm));

    /* 이어지자마자 지금 걸음을 읽어 준다. 이 화면에 들어온 사람이 가장 먼저
       듣고 싶은 것이 그것이다 */
    // [F19][호출] readStepNote(usecase/cook-along:F6) → ▷ session.say() — 들어오자마자 지금 걸음을 읽어 준다
    session.say(
      readStepNote(
        stepRef.current,
        recipe.steps.length,
        recipe.steps[stepRef.current]?.text ?? "",
      ),
    );

    /** 소리 크기를 막대에 옮긴다 */
    const levels = new Float32Array(BAR_COUNT);
    // [F20][반복] requestAnimationFrame 으로 한 컷씩 — mic.level() 을 막대 높이에 옮긴다
    const draw = () => {
      const loud = micRef.current?.level() ?? 0;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        const target = Math.min(1, IDLE[i] * (0.3 + loud * 2.4));
        levels[i] += (target - levels[i]) * 0.34;
        barsRef.current[i]?.style.setProperty("--h", levels[i].toFixed(3));
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
  }, [recipe, gender, tone, stop, handleHeard]);

  /*
   * 이 화면에 들어오면 알아서 말동무를 부른다.
   *
   * 한 번만 부르도록 표시를 남긴다. 개발 중에 React 가 효과를 두 번 돌려 보는데,
   * 그때 웹소켓이 두 개 열리면 같은 걸음을 두 번 읽는다.
   */
  // [F21][분기] 아직 안 불러 봤으면 → true: start(F12) 를 한 번 부른다(자동으로 켜진다)
  useEffect(() => {
    if (triedRef.current) return;
    triedRef.current = true;
    void start();
  }, [start]);

  /* 걸음이 바뀌면 그 걸음을 읽어 준다.
     처음 이어질 때 읽는 것은 위 start 가 맡으므로 여기서는 바뀔 때만 본다 */
  const firstRef = useRef(true);
  // [F22][분기] 걸음이 바뀌었나? 처음 한 번은 건너뛰고(start 가 이미 읽었다),
  // 그 뒤로는 ▷ session.say(readStepNote(...)) 로 새 걸음을 읽어 준다
  useEffect(() => {
    // 처음 한 번은 건너뛴다. 안 그러면 들어오자마자 두 번 읽는다
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }

    sessionRef.current?.say(
      readStepNote(stepIndex, recipe.steps.length, recipe.steps[stepIndex]?.text ?? ""),
    );
    // 걸음이 바뀔 때만 읽는다. 레시피가 통째로 바뀌는 일은 이 화면에서 없다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  /* 화면을 떠날 때 마이크와 웹소켓이 열린 채로 남지 않게 한다 */
  useEffect(() => stop, [stop]);

  return (
    <div className="ck-ask">
      <h2 className="ck-h2">
        <span aria-hidden="true">💬</span> {cookCopy.askLabel}
      </h2>

      {/* 지금 무엇을 하면 되는지 */}
      <p className="ck-ask-lead">
        <span className="ck-ask-ico" aria-hidden="true">
          <Icon name="mic" size={17} />
        </span>
        {phase === "live"
          ? cookCopy.askLive
          : phase === "opening"
            ? cookCopy.askOpening
            : cookCopy.askIdle}
      </p>

      {/* 마이크 단추와 소리 그림을 한 줄에 둔다 */}
      <div className="ck-mic-row">
        <button
          className="ck-mic"
          type="button"
          onClick={() => (phase === "off" ? void start() : stop())}
          // 이어지는 동안에는 눌러도 소용이 없다
          disabled={phase === "opening"}
          aria-label={phase === "live" ? "마이크 끄기" : "마이크 켜기"}
          aria-pressed={phase === "live"}
          data-live={phase === "live" ? "" : undefined}
        >
          <Icon name="mic" size={22} />
        </button>

        {/* 소리 그림. 상태는 위 문장이 알려 주므로 읽어 주는 기계에는 숨긴다 */}
        <div className="ck-bars" aria-hidden="true" data-live={phase === "live" ? "" : undefined}>
          {IDLE.map((h, i) => (
            <span
              className="ck-bar"
              key={i}
              ref={(el) => {
                barsRef.current[i] = el;
              }}
              style={
                {
                  "--h": String(h),
                  "--d": (i * 0.05).toFixed(3) + "s",
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      {/*
        브라우저가 소리를 막았을 때만 나온다.
        이 화면은 사람이 아무것도 안 누른 채로 시작하는데, 그런 페이지에서는
        브라우저가 소리를 못 내게 한다. 한 번 누르면 그때부터 풀린다.
      */}
      {muted && (
        <button
          className="btn btn-fill ck-unmute"
          type="button"
          onClick={() => void speakerRef.current?.unblock().then((ok) => setMuted(!ok))}
        >
          <span aria-hidden="true">🔈</span> 소리 켜기 — 브라우저가 안내 목소리를 막고 있습니다
        </button>
      )}

      {/* 말로 무엇을 시킬 수 있는지 */}
      <p className="ck-hint">{cookCopy.askHint}</p>

      {/* 잘못됐을 때만 나오는 잔소리 */}
      {error && (
        <p className="ck-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
