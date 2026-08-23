/**
 * 어댑터 · 브라우저에 딸린 읽어 주기(Web Speech).
 *
 * 여기 있는 목소리는 **마지막 대비책**이다. 요리 화면의 스피커 단추는
 *   ① 말동무가 이어져 있으면 그쪽에 시키고
 *   ② 안 이어져 있어도 키가 있으면 제미나이 목소리를 따로 불러 읽히고
 *   ③ 둘 다 안 되면 여기로 온다.
 *
 * ③ 에서도 아무 목소리나 쓰면 안 된다. 사람이 "남성 · 차분한" 으로 골라 두었는데
 * 갑자기 다른 목소리가 나오면 같은 안내가 아니라 딴 사람이 끼어든 것처럼 들린다.
 * 그래서 브라우저가 가진 한국어 목소리 중에서 고른 성별에 가장 가까운 것을 찾고,
 * 말투는 빠르기와 높낮이로 흉내 낸다.
 */

import type { VoiceGender, VoiceTone } from "@/lib/domain/voice-tone";

/**
 * 목소리 이름에 흔히 들어가는 낱말.
 *
 * 브라우저마다 이름이 제각각이라(윈도우는 Heami·InJoon, 크롬은 "한국의 여성")
 * 목록을 넉넉히 둔다. 못 찾으면 아래에서 높낮이로만 갈라 준다.
 */
const NAME_HINTS: Record<VoiceGender, readonly string[]> = {
  // 윈도우 · 크롬 · 안드로이드에서 쓰는 여성 한국어 목소리 이름들
  female: ["heami", "sunhi", "yuna", "여성", "female", "woman"],
  // 남성 쪽. 윈도우 InJoon, 안드로이드 male
  male: ["injoon", "hyunsu", "gookmin", "남성", "male", "man"],
};

/**
 * 말투마다 빠르기와 높낮이.
 *
 * 제미나이 목소리는 말투 이름 그대로 골라 주지만, 브라우저 목소리는 하나뿐이라
 * 이 두 값으로만 흉내 낼 수 있다. 요리 안내라 셋 다 느린 편에 둔다 —
 * 불 앞에서는 한 번에 알아들어야 한다.
 */
const TONE_KNOBS: Record<VoiceTone, { rate: number; pitch: number }> = {
  // 또박또박. 기준이 되는 값
  calm: { rate: 0.95, pitch: 1 },
  // 밝은 쪽은 조금 빠르고 높게
  bright: { rate: 1.05, pitch: 1.15 },
  // 부드러운 쪽은 느리고 낮게
  soft: { rate: 0.88, pitch: 0.95 },
};

/** 이름에 힌트 낱말이 들어 있는지. 대소문자는 안 가린다 */
// [F1][함수] hinted(name, hints): 목소리 이름에 힌트 낱말이 들었는지
// 입력: name + hints → 처리: 소문자화 후 포함 검사 → 출력: boolean (F2·F5 가 부른다)
function hinted(name: string, hints: readonly string[]): boolean {
  const lower = name.toLowerCase();
  return hints.some((h) => lower.includes(h));
}

/**
 * 브라우저가 가진 목소리 중 고른 성별에 가장 가까운 한국어 목소리.
 *
 * 못 찾으면 null 을 돌려주고, 부르는 쪽은 그냥 기본 목소리로 읽힌다 —
 * 목소리가 안 맞는 것보다 아예 안 읽히는 쪽이 나쁘다.
 */
// [F2][함수] pickVoice(gender): 고른 성별에 가장 가까운 한국어 목소리를 찾는다
// 입력: gender → 처리: 목소리 목록 → 한국어만 → 이름 힌트 대조 → 출력: 목소리 또는 null
function pickVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
  /* 목소리 목록은 늦게 채워진다. 처음 부르면 빈 배열이 오는 브라우저가 있어서
     비어 있으면 없는 것으로 보고 기본 목소리에 맡긴다 */
  // [F3][외부] ▷ speechSynthesis.getVoices() — 브라우저가 가진 목소리 목록 → all
  const all = speechSynthesis.getVoices();

  // 한국어만 남긴다. ko-KR 도 있고 ko_KR 로 적는 브라우저도 있다
  // [F4][반복] all 을 훑어 한국어만 남긴다 → korean
  const korean = all.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith("ko"));

  if (korean.length === 0) return null;

  // 고른 성별에 맞는 이름이 있으면 그것부터
  // [F5][반복] korean 을 훑다가 고른 성별 힌트가 든 목소리를 만나면 멈춘다 → wanted
  const wanted = korean.find((v) => hinted(v.name, NAME_HINTS[gender]));
  if (wanted) return wanted;

  /* 반대 성별로 이름이 잡히는 것은 빼 본다. 남성을 골랐는데 남성 목소리가 없을 때
     여성 이름이 붙은 것을 그대로 쓰면 성별이 정반대가 된다 */
  const other = gender === "female" ? "male" : "female";
  const neutral = korean.find((v) => !hinted(v.name, NAME_HINTS[other]));

  // 그마저 없으면 한국어 아무거나. 아래에서 높낮이로 조금이나마 갈라 준다
  // [F6][반환] 반대 성별로 안 잡히는 것, 없으면 한국어 아무거나 → F10 이 쓴다
  return neutral ?? korean[0];
}

/** 지금 읽고 있는 것을 끊는다 */
// [F7][함수] stopBrowserSpeech(): 읽고 있는 것을 끊는다
// 입력: 없음 → 처리: ▷ speechSynthesis.cancel() → 출력: 없음 (cook-shell 의 hush 가 부른다)
export function stopBrowserSpeech(): void {
  if (typeof speechSynthesis === "undefined") return;

  speechSynthesis.cancel();
}

/**
 * 한 문장을 브라우저 목소리로 읽는다.
 *
 * 돌려주는 값은 "읽히기 시작했는지" 다. 이 브라우저에 읽어 주기가 아예 없으면
 * false 가 오고, 부르는 쪽은 그때만 사람에게 알려 주면 된다.
 */
// [F8][함수] speakWithBrowser(text, gender, tone, onDone): 브라우저 목소리로 한 문장 읽는다
// 입력: text(사람이 들을 말) + gender + tone + onDone → 처리: 목소리·빠르기·높낮이 맞춰 재생
// 출력: 읽히기 시작했는지 boolean
export function speakWithBrowser(
  text: string,
  gender: VoiceGender,
  tone: VoiceTone,
  /** 다 읽었거나 도중에 막혔을 때. 단추를 되돌리는 데 쓴다 */
  onDone?: () => void,
): boolean {
  // 서버에서 그려질 때도 이 파일이 딸려 올 수 있어서 먼저 본다
  // [F9][분기] 이 브라우저에 읽어 주기가 없음 → true: false 반환 / false: F10
  if (typeof speechSynthesis === "undefined") return false;

  // 앞서 읽던 것이 있으면 끊는다. 안 그러면 줄줄이 쌓여서 계속 읽는다
  speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);

  // 한국어로 읽어 달라고 못 박는다. 안 하면 영어 목소리가 한글을 더듬는다
  utter.lang = "ko-KR";

  // [F10][호출] gender → pickVoice(F2) → voice
  const voice = pickVoice(gender);

  // 찾았으면 그 목소리로. 못 찾았으면 lang 만 보고 브라우저가 고른다
  if (voice) utter.voice = voice;

  // [F11][흐름] tone → TONE_KNOBS 표 → knobs(rate, pitch) → utter 에 얹는다
  const knobs = TONE_KNOBS[tone];
  utter.rate = knobs.rate;

  /* 이름으로 성별을 못 가른 목소리라면 높낮이로라도 갈라 준다.
     흉내에 지나지 않지만, 여성 목소리가 남성 안내를 그대로 읽는 것보다는 낫다 */
  // [F12][분기] 이름으로 성별을 못 가른 남성 → 높낮이를 0.75배로 낮춰 흉내 낸다
  const matched = voice ? hinted(voice.name, NAME_HINTS[gender]) : false;
  utter.pitch = knobs.pitch * (matched || gender === "female" ? 1 : 0.75);

  /* 끝났을 때와 막혔을 때를 똑같이 다룬다. 부르는 쪽이 알고 싶은 것은
     "이제 안 읽고 있다" 는 것 하나뿐이다 */
  if (onDone) {
    utter.onend = () => onDone();
    utter.onerror = () => onDone();
  }

  // [F13][외부] utter ▷ speechSynthesis.speak() — 실제로 소리가 난다
  speechSynthesis.speak(utter);

  // [F14][반환] true → cook-shell 이 '읽는 중' 표시를 켠다
  return true;
}
