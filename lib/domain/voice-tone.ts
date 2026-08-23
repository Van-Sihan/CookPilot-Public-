/**
 * 도메인 · 안내 목소리.
 *
 * 고를 수 있는 것이 둘이다 — 성별과 말투. 그 둘이 무엇인지만 여기서 정한다.
 * "차분한" 같은 한국어도, 제미나이가 쓰는 목소리 이름도 여기 없다.
 * 앞엣것은 화면이 고르는 말이고, 뒤엣것은 어댑터가 아는 것이다.
 */

/** 목소리의 성별. 속이름이라 화면에 그대로 나가지 않는다 */
export type VoiceGender = "female" | "male";

/** 화면에 늘어놓을 차례 */
export const voiceGenders = ["female", "male"] as const;

/** 아무것도 안 고른 사람에게 줄 성별 */
export const DEFAULT_GENDER: VoiceGender = "female";

/** 고를 수 있는 말투 */
export type VoiceTone = "calm" | "bright" | "soft";

/** 화면에 늘어놓을 차례 */
export const voiceTones = ["calm", "bright", "soft"] as const;

/** 아무것도 안 고른 사람에게 줄 말투. 요리 안내는 또박또박한 쪽이 안전하다 */
export const DEFAULT_TONE: VoiceTone = "calm";

/**
 * 밖에서 들어온 글자를 말투로 받아 준다.
 *
 * `low` 를 따로 받아 주는 까닭 — 예전 판에서 "낮은" 말투를 그 이름으로 담아 두었다.
 * 그대로 두면 예전에 고른 사람이 기본값으로 되돌아간다. 이름만 바뀌고 뜻은 같으니
 * 조용히 이어 준다.
 */
export function resolveVoiceTone(raw: unknown): VoiceTone {
  // 예전 이름을 지금 이름으로 이어 준다
  if (raw === "low") return "soft";

  // 목록에 있는 이름일 때만 그대로 쓴다
  return voiceTones.includes(raw as VoiceTone) ? (raw as VoiceTone) : DEFAULT_TONE;
}

/** 밖에서 들어온 글자를 성별로 받아 준다. 모르는 값이면 기본값으로 돌린다 */
export function resolveVoiceGender(raw: unknown): VoiceGender {
  return voiceGenders.includes(raw as VoiceGender) ? (raw as VoiceGender) : DEFAULT_GENDER;
}
