/**
 * 어댑터 · 제미나이에게 레시피를 받아 오는 진짜 방법.
 *
 * 유스케이스가 적어 둔 RecipeGateway 약속을 채워 준다.
 * 제미나이의 주소·요청 모양·오류 코드를 아는 파일은 여기 하나뿐이다.
 *
 * 브라우저에서 직접 부른다. 우리 서버를 거치지 않는 까닭은 요금제에 적어 둔 약속
 * 때문이다 — 키는 이 브라우저 안에만 있고 서버로 보내지 않는다.
 */

import { readRecipe, type Recipe } from "@/lib/domain/recipe";
import type { AudioClip, GatewayRecipe, RecipeGateway } from "@/lib/usecase/plan-recipe";

/** 줄바꿈 한 글자. 프롬프트 여러 줄을 이어 붙일 때 쓴다 */
const NL = "\n";

/** 제미나이 REST 주소의 앞부분 */
const API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * 모델에게 "이 모양으로만 답하라" 고 못 박는 틀.
 *
 * 이걸 안 주면 모델이 "네, 제육볶음 레시피입니다!" 같은 인사말을 붙여서
 * JSON 으로 못 읽는 답이 온다. 틀을 주면 모델 쪽에서 모양을 맞춰 준다.
 *
 * 타입 이름이 대문자인 것은 제미나이가 정한 것이다(OpenAPI 를 줄여 쓴 규격).
 */
const RECIPE_SCHEMA = {
  type: "OBJECT",
  properties: {
    // 알아들은 요리 이름
    title: { type: "STRING" },
    /* 유튜브에서 옮겨 올 때 원작자 채널 이름. 다른 길로 올 때는 비어 온다.
       required 에 안 넣는 까닭 — 안 넣으면 모델이 억지로 지어낸다 */
    channel: { type: "STRING" },
    // 몇 인분 기준으로 적었는지
    servings: { type: "INTEGER" },
    ingredients: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          amount: { type: "STRING" },
          // 집에 늘 있는 양념인지. 장보기에서 체크를 뺄지 정한다
          pantry: { type: "BOOLEAN" },
        },
        required: ["name", "amount", "pantry"],
      },
    },
    steps: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          text: { type: "STRING" },
          // 시간이 걸리는 걸음에만. 없으면 안 적는다
          minutes: { type: "INTEGER" },
        },
        required: ["text"],
      },
    },
  },
  required: ["title", "servings", "ingredients", "steps"],
} as const;

/** 모델에게 어떤 자세로 답하라고 일러 주는 말 */
function systemPrompt(servings: number): string {
  return [
    "너는 한국 가정식을 잘 아는 요리 도우미다.",
    `${servings}인분 기준으로 레시피를 만든다.`,
    "재료 이름은 마트에서 그대로 검색할 수 있는 말로 적는다. (예: '돼지고기 앞다리살')",
    "소금·간장·설탕·식용유·후추처럼 집에 흔히 있는 것은 pantry 를 true 로 둔다.",
    "조리 순서는 한 문장씩, 불 앞에서 한 번 듣고 따라 할 수 있게 짧게 적는다.",
    "시간이 걸리는 걸음에는 minutes 를 적는다.",
    "요리 이름을 못 알아들었으면 title 을 빈 글자로 두고 나머지도 비운다.",
  ].join("\n");
}

/** 제미나이가 오류에 붙여 보내는 것 중 우리가 갈래를 나눌 때 쓰는 값 */
type GeminiError = { error?: { code?: number; status?: string } };

/** HTTP 상태와 오류 몸통을 보고 우리가 쓰기로 한 낱말로 바꾼다 */
function reasonFor(status: number, body: GeminiError): Exclude<GatewayRecipe, { ok: true }>["reason"] {
  // 키가 틀렸거나 권한이 없다. 사람이 키를 다시 넣어야 풀린다
  if (status === 400 || status === 401 || status === 403) return "key";

  // 너무 자주 불렀다. 잠시 뒤에 다시 하면 된다
  if (status === 429 || body.error?.status === "RESOURCE_EXHAUSTED") return "too-many";

  // 나머지는 저쪽 사정이라 아는 척하지 않는다
  return "unreachable";
}

/** 응답 몸통에서 모델이 적어 보낸 글자를 꺼낸다 */
function textOf(payload: unknown): string {
  // 응답 모양이 깊어서 한 칸씩 조심스럽게 내려간다
  const bag = payload as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  // 후보가 여럿 올 수 있지만 우리는 하나만 달라고 했으니 첫 번째만 본다
  const parts = bag.candidates?.[0]?.content?.parts;

  // 조각이 여럿으로 쪼개져 올 수 있어서 이어 붙인다
  return parts?.map((p) => p.text ?? "").join("") ?? "";
}

/**
 * 키와 모델을 쥔 게이트웨이를 하나 만들어 준다.
 *
 * 미리 만들어 두고 돌려쓰지 않는다. 사람이 키를 바꾸거나 답변 속도를 바꾸면
 * 다른 값으로 새로 만들어야 하기 때문이다.
 */
export function geminiRecipeGateway(apiKey: string, model: string): RecipeGateway {
  /** 실제로 제미나이에 다녀오는 부분. 두 길이 똑같이 하는 일이라 한곳에 모았다 */
  /**
   * 실제로 제미나이에 다녀오는 부분. 여러 길이 똑같이 하는 일이라 한곳에 모았다.
   *
   * `sourceOf` 는 모델이 보낸 값을 보고 출처를 정하는 함수다. 안 주면
   * 도메인이 정한 기본값(쿡파일럿이 만든 것)이 그대로 남는다 —
   * 유튜브에서 옮겨 올 때만 원작자를 채워 넣으려고 뚫어 둔 구멍이다.
   */
  async function ask(
    parts: unknown[],
    servings: number,
    sourceOf?: (bag: Record<string, unknown>) => Recipe["source"],
  ): Promise<GatewayRecipe> {
    let res: Response;
    try {
      res = await fetch(`${API_ROOT}/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          /* 키를 주소(?key=)가 아니라 머리말에 싣는다.
             주소에 실으면 브라우저 기록과 중간 서버 로그에 키가 남는다 */
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          systemInstruction: { parts: [{ text: systemPrompt(servings) }] },
          generationConfig: {
            // JSON 으로만 답하라고 못 박는다
            responseMimeType: "application/json",
            responseSchema: RECIPE_SCHEMA,
          },
        }),
      });
    } catch {
      // 인터넷이 끊겼거나 주소를 못 찾았다. 값이 틀린 것과는 다른 실패다
      return { ok: false, reason: "unreachable" };
    }

    // 200 이 아니면 몸통에서 까닭을 읽어 본다
    if (!res.ok) {
      // 오류 몸통이 JSON 이 아닐 수도 있어서 실패해도 넘어간다
      const body = (await res.json().catch(() => ({}))) as GeminiError;
      return { ok: false, reason: reasonFor(res.status, body) };
    }

    // 여기서부터는 모델이 뭘 보냈든 우리 규칙으로 걸러 낸다
    let parsed: unknown;
    try {
      // 몸통을 읽고, 그 안에 담긴 글자를 다시 JSON 으로 푼다 — 두 겹이다
      parsed = JSON.parse(textOf(await res.json()));
    } catch {
      // 모델이 JSON 이 아닌 것을 보냈다
      return { ok: false, reason: "shape" };
    }

    /* 요리 이름을 못 알아들었을 때는 빈 title 로 오라고 일러 두었다.
       그건 모양이 틀린 것과 다르다 — 사람이 다시 말하면 풀린다 */
    if (!(parsed as { title?: string })?.title) {
      return { ok: false, reason: "unheard" };
    }

    // 칸을 하나씩 확인하는 일은 통째로 도메인에 맡긴다
    const read = readRecipe(parsed, servings);

    // 걸렸으면 까닭을 그대로 올려 보낸다
    if (!read.ok) return { ok: false, reason: read.problem };

    /* 출처를 바꿔 달 일이 있으면 여기서 바꾼다. readRecipe 는 늘 "AI 가 만든 것"
       으로 적어 두는데, 유튜브에서 옮겨 온 것을 그렇게 두면 원작자가 사라진다 */
    const recipe = sourceOf
      ? { ...read.recipe, source: sourceOf(parsed as Record<string, unknown>) }
      : read.recipe;

    return { ok: true, recipe: recipe satisfies Recipe };
  }

  return {
    fromSpeech(clip: AudioClip, servings: number) {
      return ask(
        [
          // 소리를 그대로 실어 보낸다. 알아듣기와 레시피 만들기를 한 번에 시킨다
          { inlineData: { mimeType: clip.mimeType, data: clip.base64 } },
          { text: "이 말에서 만들려는 요리를 알아듣고, 그 레시피를 만들어 줘." },
        ],
        servings,
      );
    },

    fromDish(dish: string, servings: number) {
      // 글로 적은 이름은 그대로 넘긴다
      return ask([{ text: `"${dish}" 레시피를 만들어 줘.` }], servings);
    },

    fromYoutube(url: string, servings: number) {
      return ask(
        [
          /* 영상 주소를 그대로 실어 보낸다. 제미나이는 유튜브 주소를 받으면
             영상을 직접 보고 답한다 — 우리가 자막을 긁어 올 필요가 없다 */
          { fileData: { fileUri: url } },
          {
            text: [
              "이 영상에 나오는 요리의 레시피를 그대로 옮겨 적어 줘.",
              "영상에 없는 재료나 순서를 보태지 마.",
              "channel 칸에는 이 영상을 올린 채널 이름을 적어 줘.",
              "요리 영상이 아니면 title 을 빈 글자로 두고 나머지도 비워 줘.",
            ].join(NL),
          },
        ],
        servings,
        /* 원작자를 반드시 남긴다. 남의 영상에서 옮겨 놓고 우리 것인 양
           보여 주면 안 된다 */
        (bag) => ({
          kind: "youtube",
          channel: typeof bag.channel === "string" && bag.channel.trim()
            ? bag.channel.trim()
            : "채널 이름을 못 받았습니다",
          url,
        }),
      );
    },

    fromFridge(items: readonly string[], servings: number) {
      return ask(
        [
          {
            text: [
              `지금 집에 이런 재료가 있어: ${items.join(", ")}`,
              "이 재료로 만들 수 있는 요리를 하나 골라 레시피를 만들어 줘.",
              "적어 준 재료를 되도록 많이 쓰고, 없는 재료는 소금·간장처럼 집에 흔한 것만 보태.",
              "보탠 것은 pantry 를 true 로 두어서 장 볼 때 빠지게 해 줘.",
            ].join(NL),
          },
        ],
        servings,
      );
    },
  };
}
