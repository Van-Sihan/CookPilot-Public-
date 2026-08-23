"use client";

/**
 * 요리 화면 오른쪽의 타이머.
 *
 * 손으로도 걸 수 있고 말로도 걸린다("3분 뒤에 알려줘").
 * 말을 알아듣는 규칙은 도메인에 있고, 여기서는 걸린 것을 세어 보여 주기만 한다.
 *
 * 남은 시간을 상태로 들고 있지 않은 것이 요점이다.
 * 끝나는 시각만 담아 두고 1초마다 다시 셈한다 — 그래야 탭을 감췄다가 돌아와도
 * 시간이 맞는다. 1초씩 빼는 방식은 탭이 쉬는 동안 멈춰 버려서 늘 늦어진다.
 */

import { useEffect, useRef, useState } from "react";
import { formatRemaining } from "@/lib/domain/cook-progress";
import { cookCopy } from "@/lib/cook-content";

/** 걸어 둔 타이머 하나 */
export type CookAlarm = {
  /** 서로 구분하는 이름표 */
  id: string;
  /** 무엇을 재는 중인지 */
  label: string;
  /** 언제 끝나는지. 밀리초로 적은 시각이다 */
  endsAt: number;
  /**
   * 처음에 몇 초짜리로 걸었는지.
   *
   * 남은 시간은 "끝나는 시각 − 지금" 으로 셈하는데, 화면을 그리는 도중에는
   * "지금" 을 물어볼 수 없다(같은 값을 넣어도 그릴 때마다 답이 달라지는 함수라
   * React 가 막는다). 그래서 첫 번째 초침이 오기 전까지는 이 값을 그대로 보여 준다.
   */
  seconds: number;
};

type Props = {
  /** 걸어 둔 타이머들 */
  alarms: readonly CookAlarm[];
  /** 새로 걸 때 */
  onAdd: (label: string, minutes: number) => void;
  /** 지울 때 */
  onDrop: (id: string) => void;
  /** "다음 단계 알려줘" 를 눌렀을 때 */
  onAskNext: () => void;
};

// [F1][함수] CookTimer({alarms, onAdd, onDrop, onAskNext}): 요리 화면 오른쪽 타이머 칸
// 입력: alarms(껍데기가 쥔 목록) + 세 손잡이 → 처리: 1초마다 남은 시간 셈 → 출력: 화면(JSX)
export function CookTimer({ alarms, onAdd, onDrop, onAskNext }: Props) {
  /* 무엇을 재는지 적는 칸 */
  // [F2][흐름] 이름칸 → label / 분칸 → minutes / 지금 시각 → now
  const [label, setLabel] = useState("");

  /* 몇 분인지. 글자로 쥐고 있어야 "3." 처럼 덜 적은 상태에서도 글자가 안 튄다 */
  const [minutes, setMinutes] = useState("3");

  /* 지금 시각. 1초마다 새로 담고, 그때마다 화면이 다시 그려진다.
     0 이면 아직 초침이 한 번도 안 왔다는 뜻이다 —
     처음부터 Date.now() 를 담아 두면 서버가 그린 값과 브라우저가 그린 값이 달라진다 */
  const [now, setNow] = useState(0);

  /* 이미 울린 타이머를 기억해 둔다. 안 그러면 1초마다 계속 울린다 */
  // [F3][흐름] 이미 울린 타이머 번호 → rungRef (같은 알람을 두 번 안 울리려고)
  const rungRef = useRef<Set<string>>(new Set());

  // [F4][반복] 1초마다 now 를 갱신한다. 화면을 떠날 때 시계를 거둔다
  useEffect(() => {
    // 걸어 둔 것이 없으면 셈할 것도 없다. 쓸데없이 1초마다 깨우지 않는다
    if (alarms.length === 0) return;

    /* 여기서 곧바로 setNow 를 부르지 않는다. 효과 안에서 상태를 바로 바꾸면
       화면을 그리자마자 또 그리게 되어 React 가 막는다.
       마침 그럴 까닭도 없다 — 방금 건 타이머는 위에서 seconds 로 제 길이를
       그대로 보여 주고, 1초 뒤 첫 초침부터 진짜 남은 시간으로 바뀐다 */
    const id = window.setInterval(() => setNow(Date.now()), 1000);

    // 화면이 사라지거나 타이머가 바뀌면 걷어 낸다
    return () => window.clearInterval(id);
  }, [alarms.length]);

  /* 끝난 타이머가 있으면 소리를 낸다.
     그리는 도중이 아니라 그린 뒤에 해야 해서 useEffect 안에 둔다 */
  // [F5][반복] alarms 를 훑어 끝난 것을 찾는다 → 아직 안 울렸으면 ▷ beep(F7) 로 소리를 낸다
  useEffect(() => {
    for (const alarm of alarms) {
      // 아직 안 끝났거나 이미 울린 것은 넘어간다
      if (alarm.endsAt > Date.now() || rungRef.current.has(alarm.id)) continue;

      rungRef.current.add(alarm.id);
      beep();
    }
  });

  // [F6][함수] onSubmit(e): '타이머 시작' 을 눌렀을 때
  // 입력: label + minutes → 처리: 숫자 검사 후 onAdd 호출 → 출력: 없음
  // onAdd 는 cook-shell 의 addAlarm — 말로 건 타이머와 **같은 자리**로 들어간다
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // 가만두면 브라우저가 페이지를 통째로 새로 고쳐 버린다
    e.preventDefault();

    const m = Number(minutes);

    // 숫자로 못 읽거나 0 이하면 걸 까닭이 없다
    if (!Number.isFinite(m) || m <= 0) return;

    // 이름을 안 적었으면 그냥 "타이머" 로 둔다. 이름 때문에 못 걸게 할 일은 아니다
    onAdd(label.trim() || "타이머", m);

    // 다음 타이머를 위해 이름칸만 비운다. 분은 그대로 두는 편이 여러 번 걸 때 편하다
    setLabel("");
  }

  return (
    <div className="ck-timer">
      <h2 className="ck-h2">
        <span aria-hidden="true">⏱</span> {cookCopy.timerLabel}
      </h2>

      {/* 손으로 거는 자리 */}
      <form className="ck-timer-form" onSubmit={onSubmit}>
        {/* 이름표는 눈에 안 보이게 숨긴다. 흐린 예시가 이미 무엇을 적는지 알려 준다 */}
        <label className="sr-only" htmlFor="timer-label">
          무엇을 재는지
        </label>
        <input
          id="timer-label"
          className="ck-timer-name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={cookCopy.timerNamePlaceholder}
        />

        <label className="sr-only" htmlFor="timer-min">
          몇 분
        </label>
        <input
          id="timer-min"
          className="ck-timer-min"
          /* 휴대폰에서 숫자판이 먼저 뜨게 한다. type="number" 는 화살표가 붙고
             소수점 입력이 브라우저마다 달라서 안 쓴다 */
          inputMode="decimal"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />

        {/* 분을 손으로 올리고 내리는 단추 둘 */}
        <button
          className="ck-timer-step"
          type="button"
          onClick={() => setMinutes((v) => String(Math.max(1, Number(v) - 1 || 1)))}
          aria-label="1분 줄이기"
        >
          −
        </button>
        <button
          className="ck-timer-step"
          type="button"
          onClick={() => setMinutes((v) => String((Number(v) || 0) + 1))}
          aria-label="1분 늘리기"
        >
          +
        </button>

        <button className="btn btn-fill ck-timer-go" type="submit">
          {cookCopy.timerStart}
        </button>
      </form>

      {/* 걸어 둔 것들 */}
      {alarms.length === 0 ? (
        // 하나도 없을 때도 자리를 비워 두지 않는다. 빈 자리는 고장처럼 보인다
        <p className="ck-empty">{cookCopy.timerEmpty}</p>
      ) : (
        <ul className="ck-alarms">
          {alarms.map((a) => {
            /* 남은 초. 초침이 아직 안 왔으면 처음에 건 길이를 그대로 보여 준다 */
            const left = now === 0 ? a.seconds : (a.endsAt - now) / 1000;

            return (
              <li key={a.id} data-done={left <= 0 ? "" : undefined}>
                <span className="ck-alarm-name">{a.label}</span>

                {/* 남은 시간. 다 되면 글자가 바뀐다 */}
                <span className="ck-alarm-left">
                  {left <= 0 ? "다 됐어요!" : formatRemaining(left)}
                </span>

                <button
                  className="ck-alarm-x"
                  type="button"
                  onClick={() => onDrop(a.id)}
                  aria-label={`${a.label} 타이머 지우기`}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* 말동무에게 다음 걸음을 물어보는 지름길 */}
      <button className="btn btn-line ck-ask-next" type="button" onClick={onAskNext}>
        <span aria-hidden="true">🔔</span> {cookCopy.timerNext}
      </button>
    </div>
  );
}

/**
 * 타이머가 다 됐을 때 나는 소리.
 *
 * 소리 파일을 두지 않고 그 자리에서 만들어 낸다 — 파일을 받아 오는 동안 못 울리고,
 * 부엌에서는 그 몇백 밀리초가 아쉽다. 게다가 파일 하나를 더 챙기지 않아도 된다.
 */
// [F7][함수] beep(): 타이머가 끝났을 때 소리를 낸다
// 입력: 없음 → 처리: ▷ AudioContext 로 짧은 소리 두 번 → 출력: 없음
function beep() {
  try {
    const ctx = new AudioContext();

    // 소리를 내는 떨림판
    const osc = ctx.createOscillator();

    // 소리 크기를 다루는 손잡이. 이걸 안 끼우면 뚝 끊겨서 "딱" 하는 잡음이 난다
    const gain = ctx.createGain();

    // 880Hz 는 '라' 음이다. 부엌 소음을 뚫고 들리면서 거슬리지 않는 높이다
    osc.frequency.value = 880;
    osc.connect(gain).connect(ctx.destination);

    const now = ctx.currentTime;

    // 짧게 올렸다가
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);

    // 부드럽게 내린다
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.start(now);
    osc.stop(now + 0.62);

    // 다 울리고 나면 소리 장치를 닫는다. 안 닫으면 울릴 때마다 하나씩 쌓인다
    osc.onended = () => void ctx.close();
  } catch {
    /* 소리를 못 내는 상황이 있다(사람이 아직 아무것도 안 누른 탭 등).
       타이머 숫자는 화면에 그대로 보이므로 조용히 넘어간다 */
  }
}
