/**
 * 유스케이스 · "요리하는 내내 옆에서 말로 거들기".
 *
 * 마이크도 웹소켓도 여기서는 모른다. LiveVoiceGateway 라는 약속만 안다.
 * 이 파일이 진짜로 하는 일은 하나다 — **말동무에게 무엇을 알려 줄지 정하는 것.**
 * 레시피를 통째로 넘겨 두어야 "다음에 뭐 하지?" 같은 물음에 답할 수 있다.
 */

import type { Recipe } from "@/lib/domain/recipe";
import type { VoiceGender, VoiceTone } from "@/lib/domain/voice-tone";

/** 말동무에게 미리 알려 두는 것 */
export type CookBrief = {
  /** 지금 만드는 레시피 */
  recipe: Recipe;
  /** 어떤 성별의 목소리로 */
  gender: VoiceGender;
  /** 어떤 말투로 안내할지 */
  tone: VoiceTone;
};

/** 오간 말 한 마디 */
export type CookSaid = {
  /** 누가 말했는지 */
  who: "me" | "cook";
  /** 무슨 말이었는지 */
  text: string;
};

/** 말동무 쪽에서 일어나는 일 */
export type LiveEvent =
  /** 이제 말을 걸어도 된다 */
  | { kind: "open" }
  /**
   * 한 마디가 끝났다. 화면의 "주고받은 말" 이 이걸 쌓고, 명령도 여기서 걸러 낸다.
   *
   * 사람이 한 말은 **모델의 차례와 상관없이** 온다. 말이 멎으면 그때 한 마디로
   * 친다 — 모델의 차례가 끝나기를 기다리면, 모델이 대꾸를 안 하는 짧은 명령은
   * 영영 안 올라오고 다음 말에 들러붙는다.
   */
  | { kind: "said"; said: CookSaid }
  /** 안내 목소리 한 조각이 왔다. 스피커가 이어서 튼다 */
  | { kind: "audio"; pcm: Uint8Array }
  /** 사람이 말을 끊었다. 틀던 소리를 버려야 한다 */
  | { kind: "interrupted" }
  /** 끊겼다. 까닭이 있으면 함께 온다 */
  | { kind: "closed"; problem?: LiveProblem };

/** 말동무와 못 이어진 까닭 */
export type LiveProblem = "key" | "unreachable" | "closed";

/** 이어진 뒤에 쓰는 손잡이 */
export type LiveSession = {
  /** 마이크 소리 한 조각을 보낸다 */
  send(pcm: Int16Array): void;
  /** 글로 한마디 건넨다. 마이크를 못 쓸 때와 걸음이 바뀔 때 쓴다 */
  say(text: string): void;
  /** 끊는다 */
  close(): void;
};

/** 말동무를 이어 주는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type LiveVoiceGateway = {
  open(brief: CookBrief, onEvent: (e: LiveEvent) => void): Promise<LiveSession>;
};

/** 말투마다 어떻게 말해 달라고 부탁할지 */
const toneAsk: Record<VoiceTone, string> = {
  // 또박또박. 요리 안내의 기본이다
  calm: "차분하고 또박또박한 말투로, 서두르지 말고 안내한다.",
  // 활기차게
  bright: "밝고 활기찬 말투로, 짧게 응원하듯 안내한다.",
  // 부드럽게
  soft: "부드럽고 여유 있는 말투로 안내한다.",
};

/**
 * 말동무에게 처음에 한 번 건네는 말.
 *
 * 레시피를 통째로 넣는 까닭 — 걸음마다 다시 알려 주면 그때마다 토큰을 더 쓰고,
 * "아까 뭐라고 했지?" 같은 물음에는 어차피 답을 못 한다.
 *
 * 짧게 답하라고 거듭 이르는 까닭 — 불 앞에 선 사람은 긴 설명을 못 듣는다.
 * 모델은 그냥 두면 친절하게 길게 말한다.
 */
export function cookingBrief(brief: CookBrief): string {
  const { recipe, tone } = brief;

  // 재료를 한 줄씩 늘어놓는다
  const ingredients = recipe.ingredients
    .map((i) => `- ${i.name} ${i.amount}`)
    .join("\n");

  // 걸음마다 번호를 붙인다. 번호가 있어야 "3번째 걸음" 이라고 주고받을 수 있다
  const steps = recipe.steps
    .map((s, i) => `${i + 1}. ${s.text}${s.minutes ? ` (${s.minutes}분)` : ""}`)
    .join("\n");

  return [
    "너는 요리하는 사람 옆에 서 있는 요리 도우미다.",
    toneAsk[tone],
    "",
    "규칙:",
    "- 한 번에 한두 문장으로만 답한다. 길게 설명하지 않는다.",
    "- 상대는 손이 젖어 있고 화면을 못 본다. 숫자와 시간은 또렷하게 말한다.",
    "- 모르는 것은 지어내지 않고 모른다고 한다.",
    "- 레시피에 없는 것을 물으면 일반적인 요리 상식으로 짧게 답한다.",
    /* 마이크가 내내 켜져 있어서 부엌 소리나 혼잣말이 그대로 들어온다.
       그때마다 대꾸하면 성가시다 못해 안내를 못 듣는다 */
    "- 자기에게 한 말이 아닌 것 같으면 아무 말도 하지 않는다.",
    /* "다음" 은 화면이 알아듣고 걸음을 옮긴 뒤 [읽기] 알림을 보낸다.
       모델까지 따로 대꾸하면 "네, 다음 단계는…" 과 걸음 읽기가 겹쳐서 두 번 말한다 */
    "- '다음', '이전', '다시' 는 화면을 넘기라는 신호일 뿐이다. 절대 대답하지 마라. 아무 소리도 내지 마라.",
    "- [읽기] 로 시작하는 말을 받으면, 따옴표 안의 문장만 그대로 읽는다. 한 글자도 바꾸지 말고, 앞뒤에 아무 말도 붙이지 마라.",
    "- 특히 [읽기] 에 대고 '타이머를 걸까요?', '다 되면 말씀해 주세요' 같은 말을 덧붙이지 마라. 묻지 않은 말은 하지 않는다.",
    "",
    `지금 만드는 요리: ${recipe.title} (${recipe.servings}인분)`,
    "",
    "재료:",
    ingredients,
    "",
    "순서:",
    steps,
  ].join("\n");
}

/**
 * 이 걸음을 소리 내어 읽어 달라고 시킨다.
 *
 * 걸음이 바뀔 때마다 보낸다. 두 가지 일을 한꺼번에 한다 —
 * 말동무가 지금 몇 번째 걸음인지 알게 되고, 사람은 화면을 안 봐도 들을 수 있다.
 *
 * 걸음 글을 그대로 실어 보내는 까닭 — 처음에 레시피를 통째로 알려 주긴 했지만,
 * 대화가 길어지면 모델이 몇 번째였는지 헷갈린다. 읽을 글을 같이 주면 틀릴 일이 없다.
 */
export function readStepNote(index: number, total: number, text: string): string {
  /* 따옴표로 묶고 "그대로" 를 거듭 말한다.
     그냥 문장만 건네면 모델이 친절하게 군말을 붙인다 —
     실제로 "타이머를 설정하시면 좋아요" 같은 말을 스스로 덧붙였다.
     화면에 적힌 글과 귀에 들리는 말이 다르면 요리하는 사람이 헷갈린다. */
  return [
    `[읽기] ${index + 1}/${total} 걸음.`,
    `아래 따옴표 안의 문장을 토씨 하나 바꾸지 말고 그대로 소리 내어 읽어라.`,
    `앞에도 뒤에도 다른 말을 붙이지 마라. 인사도, 설명도, 권유도 하지 마라.`,
    `"${text}"`,
  ].join("\n");
}
