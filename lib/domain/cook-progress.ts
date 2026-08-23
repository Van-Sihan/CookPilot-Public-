/**
 * 도메인 · 요리를 진행하는 규칙.
 *
 * 지금 몇 번째 걸음인지, 앞뒤로 어떻게 움직이는지, 말로 걸어 둔 타이머를 어떻게 읽는지.
 * 마이크도 제미나이도 여기서는 모른다.
 */

/** 걸음을 앞뒤로 옮긴다. 범위를 벗어나면 끝에 붙여 둔다 */
// [F1][함수] moveStep(now, by, total): 걸음을 앞뒤로 옮긴다
// 입력: now(지금 걸음) + by(+1/-1) + total(전체 수) → 처리: 범위 안으로 밀기 → 출력: 새 걸음 번호
export function moveStep(now: number, by: number, total: number): number {
  // 걸음이 하나도 없으면 움직일 데가 없다
  // [F2][분기] total <= 0 → true: 0 반환 / false: F3
  if (total <= 0) return 0;

  // 첫 걸음 앞이나 마지막 걸음 뒤로는 못 간다. 넘어가면 끝에 머문다
  // [F3][반환] now+by 를 0~total-1 로 자른 값 → cook-shell 의 setStepIndex 로 전달
  return Math.min(total - 1, Math.max(0, now + by));
}

/** 마지막 걸음에 서 있는지. 요리 화면이 "다음" 대신 "요리 끝내기" 를 띄울지 정한다 */
// [F4][함수] isLastStep(now, total): 마지막 걸음인지 판정
// 입력: now + total → 처리: now >= total-1 확인 → 출력: boolean (cook-shell 의 단추가 쓴다)
export function isLastStep(now: number, total: number): boolean {
  // 걸음이 없으면 마지막이라고 봐도 된다 — 더 갈 데가 없다
  return total <= 0 || now >= total - 1;
}

/**
 * 숫자를 말로 한 것들.
 *
 * 사람은 "3분" 이라고 또박또박 말해도 인식기가 "삼분" 으로 옮겨 적을 때가 있다.
 * 숫자만 찾으면 그때 타이머가 안 걸린다 — 요리하는 사람 눈에는 그냥 고장이다.
 */
const WORD_NUMBERS: readonly [string, number][] = [
  // 긴 것부터 찾아야 한다. "십오" 를 "십" 으로 먼저 잡으면 15가 10이 된다
  ["십오", 15], ["열다섯", 15], ["이십", 20], ["스물", 20], ["삼십", 30], ["서른", 30],
  ["사십", 40], ["마흔", 40], ["오십", 50], ["쉰", 50],
  ["하나", 1], ["한", 1], ["일", 1], ["둘", 2], ["두", 2], ["이", 2],
  ["셋", 3], ["세", 3], ["삼", 3], ["넷", 4], ["네", 4], ["사", 4],
  ["다섯", 5], ["오", 5], ["여섯", 6], ["육", 6], ["일곱", 7], ["칠", 7],
  ["여덟", 8], ["팔", 8], ["아홉", 9], ["구", 9], ["열", 10], ["십", 10],
];

/** "3분"·"삼분" 처럼 단위 앞에 붙은 수를 읽는다. 못 찾으면 null */
// [F5][함수] numberBefore(text, unit): 단위 앞에 붙은 수를 읽는다
// 입력: text(사람이 한 말) + unit('분'·'시간') → 처리: 숫자 → 말로 한 수 순으로 대조 → 출력: 숫자 또는 null
function numberBefore(text: string, unit: string): number | null {
  // [F6][흐름] text → 숫자 정규식 매치 → digits
  // 숫자로 적혀 있으면 그게 가장 확실하다
  const digits = text.match(new RegExp(String.raw`(\d+)\s*${unit}`));
  // [F7][분기] digits 있음 → true: Number(digits[1]) 반환 / false: F8
  if (digits) return Number(digits[1]);

  // 없으면 말로 한 수를 찾는다. 위 목록이 긴 것부터라 겹치는 일이 없다
  // [F8][반복] WORD_NUMBERS 를 긴 것부터 훑다가 처음 걸리는 낱말에서 멈추고 그 값을 반환
  for (const [word, value] of WORD_NUMBERS) {
    if (new RegExp(`${word}\s*${unit}`).test(text)) return value;
  }

  // [F9][반환] 하나도 못 찾음 → null → F13 이 '숫자 못 찾음' 으로 다룬다
  return null;
}

/**
 * 말로 건 타이머를 알아듣는다.
 *
 * "3분 뒤에 알려줘", "10분만 타이머", "1시간 30분 뒤에" 같은 말에서 분을 뽑아낸다.
 *
 * 이 일을 제미나이의 함수 호출에 맡기지 않은 까닭이 있다.
 * 타이머는 **틀리면 요리가 타는** 기능이다. 모델이 한 번씩 엉뚱한 값을 주는 것보다,
 * 규칙이 눈에 보이고 시험할 수 있는 편이 낫다. 게다가 말이 오가는 도중에
 * 함수 호출을 기다리면 그만큼 늦는다.
 */
// [F10][함수] readTimerRequest(text): 말로 건 타이머에서 분을 뽑는다
// 입력: text(마이크로 들어온 말) → 처리: 요청 낱말 확인 → 시간·분 추출 → 출력: 분(숫자) 또는 null
export function readTimerRequest(text: string): number | null {
  // 빈 말에는 걸 것이 없다
  // [F11][분기] 빈 말 → true: null 반환 / false: F12
  if (!text) return null;

  /* 타이머를 걸어 달라는 말인지 먼저 본다.
     이 말이 없으면 "3분 볶으세요" 같은 안내까지 타이머로 잘못 알아듣는다 */
  // [F12][흐름] text → 타이머 요청 낱말 정규식 → asked
  // [F12][분기] asked 가 false → null 반환(안내 문장까지 잡지 않으려고) / true: F13
  const asked =
    /알려\s*줘|알려\s*주세요|타이머|타이마|재\s*줘|재\s*주세요|세팅|맞춰|알람|걸어\s*줘|설정/.test(text);
  if (!asked) return null;

  // 시간과 분을 따로 찾는다. "1시간 30분" 처럼 둘 다 나올 수 있다
  // [F13][호출] text → numberBefore(F5) 두 번 → hour, minute
  const hour = numberBefore(text, "시간");
  const minute = numberBefore(text, "분");

  // 둘 다 없으면 숫자를 못 찾은 것이다
  // [F14][분기] 둘 다 null → true: null 반환 / false: F15
  if (hour === null && minute === null) return null;

  // 시간은 분으로 바꿔서 더한다
  // [F15][흐름] hour×60 + minute → total
  let total = (hour ?? 0) * 60 + (minute ?? 0);

  // [F16][분기] '시간 반' 이 들어 있음 → true: total += 30 / false: total 그대로
  // "한 시간 반" 처럼 반을 붙여 말하는 일이 잦다
  if (/시간\s*반/.test(text)) total += 30;

  // 0분 타이머는 걸 까닭이 없고, 하루를 넘기는 것도 이 앱이 다룰 일이 아니다
  // [F17][반환] 1~1440 이면 total, 아니면 null → live-console 의 onTimer → cook-shell 의 addAlarm 으로
  return total > 0 && total <= 1440 ? total : null;
}

/** 말로 내린 걸음 명령 */
export type StepCommand = "next" | "prev" | "repeat";

/**
 * 말 앞에 붙는 군말. "네 다음", "자 다음" 처럼 거의 늘 하나씩 붙는다.
 *
 * 이걸 안 떼면 사람이 실제로 하는 말은 거의 다 명령으로 안 읽힌다.
 * 처음에 "다음" 만 딱 받게 만들어 뒀다가 그 자리에서 안 통했다.
 */
const FILLER = /^(?:네|넹|예|응|어|음|아|자|그럼|그러면|이제|그|저|오케이|오키|ok|okay)\s+/i;

/** 말 끝에 붙는 군말. "다음 해줘", "다음이요", "다음 좀" 처럼 */
const TAIL =
  /\s*(?:해\s*줄래|해\s*줘요?|해\s*주세요|부탁\s*해요?|가\s*줄래|가\s*줘요?|가자|넘겨\s*줘|알려\s*줘요?|알려\s*주세요|줘요?|주세요|좀|해|요|이요|입니다|입니당)$/;

/**
 * 물어보는 말인지. 물음이면 명령이 아니다.
 *
 * "다음에 뭐 넣어요?" 는 낱말만 보면 "다음" 이 들었지만 화면을 넘기라는 말이 아니다.
 * 이걸 안 거르면 사람이 물어볼 때마다 화면이 제멋대로 넘어간다.
 */
const QUESTION = /뭐|뭘|무엇|어떻게|얼마|왜|언제|어디|몇|인가요|나요|까요|맞아|맞나|일까/;

/** 앞뒤 군말을 더 뗄 것이 없을 때까지 뗀다 */
// [F18][함수] coreOf(text): 앞뒤 군말을 더 뗄 것이 없을 때까지 뗀다
// 입력: text → 처리: FILLER·TAIL 제거를 되풀이 → 출력: 알맹이 문자열 (F25 가 부른다)
function coreOf(text: string): string {
  let now = text;
  let before = "";

  /* 한 번만 떼면 "네 자 다음이요" 같은 말이 안 벗겨진다.
     더 벗겨지지 않을 때까지 되풀이한다 */
  // [F19][반복] before 와 now 가 같아질 때까지 — 더 벗겨지지 않으면 끝
  while (before !== now) {
    before = now;
    now = now.replace(FILLER, "").trim().replace(TAIL, "").trim();
  }

  return now;
}

/**
 * "다음", "이전", "다시" 같은 짧은 말을 걸음 명령으로 알아듣는다.
 *
 * 사람은 "다음" 이라고만 말하지 않는다. "네 다음", "다음 해줘", "다음 단계 알려줘",
 * "넘어가자" 처럼 앞뒤에 군말을 붙인다. 그래서 군말을 떼고 남은 알맹이를 본다.
 *
 * 다만 **물음은 명령이 아니다.** "다음에 뭐 넣어요?" 에 화면이 넘어가면 안 된다.
 */
// [F20][함수] readStepCommand(text): 말에서 걸음 명령을 알아듣는다
// 입력: text(마이크로 들어온 말) → 처리: 부호 제거 → 시키는 꼴 → 물음 제외 → 알맹이 대조
// 출력: 'next' | 'prev' | 'repeat' | null
export function readStepCommand(text: string): StepCommand | null {
  // [F21][흐름] text → 문장부호 제거 → trim() → t
  // 문장부호를 떼고 앞뒤 빈칸을 다듬는다. "다음!" 과 "다음" 은 같은 말이다
  const t = text.replace(/[.!?,~·]/g, "").trim();

  // 빈 말에는 명령이 없다
  // [F22][분기] t 가 빔 → true: null 반환 / false: F23
  if (!t) return null;

  // [F23][분기] '넘어가'·'돌아가'·'다시 말해' 꼴 → 각각 next/prev/repeat 반환 / 아니면 F24
  /* 시키는 꼴이면 문장이 길어도 받아들인다.
     "이제 다음으로 넘어가 줘" 는 누가 봐도 명령이다 */
  if (/(다음\s*(단계)?\s*(으?로)?\s*넘어가|넘어가|넘겨)/.test(t)) return "next";
  if (/(이전\s*(단계)?\s*(으?로)?\s*(돌아가|가)|뒤로\s*가|되돌려)/.test(t)) return "prev";
  if (/(다시\s*(한\s*번)?\s*(말해|읽어|알려|들려))/.test(t)) return "repeat";

  // 물음이면 여기서 끝. 위의 시키는 꼴보다 뒤에 둬야 "다시 말해 줄래?" 가 산다
  // [F24][분기] 물음말이 들어 있음 → true: null 반환(화면을 안 넘김) / false: F25
  if (QUESTION.test(t)) return null;

  // 군말을 떼고 알맹이만 본다
  // [F25][호출] t → coreOf(F18) → core
  const core = coreOf(t);

  /* 알맹이가 길면 명령이 아니라 하는 말이다.
     "다음" 계열 낱말은 다 짧아서 여덟 자면 넉넉하다 */
  // [F26][분기] core 가 비었거나 8자 초과 → true: null(그냥 하는 말) / false: F27
  // [F27][분기] core 를 '다음'·'이전'·'다시' 꼴과 대조 → 걸리면 그 명령 반환 / 아니면 F28
  if (!core || core.length > 8) return null;

  if (/^다음\s*(단계|거|것|스텝)?\s*(으?로)?$/.test(core)) return "next";
  if (/^(이전|뒤로|앞|전)\s*(단계|거|것)?\s*(으?로)?$/.test(core)) return "prev";
  if (/^(다시|다시\s*한\s*번|한\s*번\s*더)$/.test(core)) return "repeat";

  // [F28][반환] null → live-console 의 handleHeard 가 '명령 아님' 으로 다룬다
  // 아무것도 안 걸리면 그냥 하는 말이다
  return null;
}

/** 남은 시간을 화면에 적는 모양으로 바꾼다. "12:05" 처럼 */
// [F29][함수] formatRemaining(seconds): 남은 초를 '12:05' 모양 글자로
// 입력: seconds → 처리: 0 아래로 안 내려가게 자른 뒤 분·초로 가름 → 출력: 문자열
export function formatRemaining(seconds: number): string {
  // 음수가 되면 0으로 붙들어 둔다. "-1:59" 는 아무 뜻이 없다
  const left = Math.max(0, Math.round(seconds));

  // 분과 초로 가른다
  const m = Math.floor(left / 60);
  const s = left % 60;

  // [F30][반환] 'm:ss' → cook-timer 화면의 남은 시간 자리로 전달
  // 초는 늘 두 자리로 맞춘다. 안 그러면 "12:5" 가 되어 자릿수가 흔들린다
  return `${m}:${String(s).padStart(2, "0")}`;
}
