/**
 * 어댑터 · 제미나이에게 레시피를 받아 오는 진짜 방법.
 *
 * 유스케이스가 적어 둔 RecipeGateway 약속을 채워 준다.
 * 제미나이의 주소·요청 모양·오류 코드를 아는 파일은 여기 하나뿐이다.
 *
 * 브라우저에서 직접 부른다. 우리 서버를 거치지 않는 까닭은 요금제에 적어 둔 약속
 * 때문이다 — 키는 이 브라우저 안에만 있고 서버로 보내지 않는다.
 */

import {
  MAX_IDEAS,
  MIN_IDEAS,
  readFridgeIdeas,
  readRecipe,
  type Recipe,
} from "@/lib/domain/recipe";
import type {
  AudioClip,
  GatewayIdeas,
  GatewayRecipe,
  RecipeGateway,
} from "@/lib/usecase/plan-recipe";

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
    /* 그 영상의 제목. 요리 이름과 다르다 —
       "10분 만에 끝내는 초간단 김치찌개 (자취생 필수)" 같은 것이 그대로 와야
       사람이 자기가 넣은 영상인지 알아본다 */
    videoTitle: { type: "STRING" },
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

/**
 * 냉장고 후보를 받아 올 때 쓰는 틀.
 *
 * 레시피 틀과 따로 두는 까닭 — 후보에는 재료도 순서도 없다.
 * 한 틀에 억지로 담으면 모델이 빈 칸을 채우려고 순서를 지어낸다.
 */
const IDEAS_SCHEMA = {
  type: "OBJECT",
  properties: {
    ideas: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          // 요리 이름
          title: { type: "STRING" },
          // 왜 이걸 고를 만한지 한 줄
          why: { type: "STRING" },
          // 대략 몇 분
          minutes: { type: "INTEGER" },
          // 사야 하는 것. 없으면 빈 배열로 와야 한다
          missing: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["title", "why", "minutes", "missing"],
      },
    },
  },
  required: ["ideas"],
} as const;

/** 모델에게 어떤 자세로 답하라고 일러 주는 말 */
// [F1][함수] systemPrompt(servings): 모델에게 줄 '이런 자세로 답하라' 글을 만든다
// 입력: servings → 처리: 규칙 줄들을 이어 붙임 → 출력: 문자열 (F5 가 쓴다)
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
// [F2][함수] reasonFor(status, body): HTTP 상태와 오류 몸통을 우리 낱말로 바꾼다
// 입력: status + body → 처리: 400/401/403→key, 429→too-many, 그 밖→unreachable → 출력: 까닭
function reasonFor(status: number, body: GeminiError): Exclude<GatewayRecipe, { ok: true }>["reason"] {
  // 키가 틀렸거나 권한이 없다. 사람이 키를 다시 넣어야 풀린다
  if (status === 400 || status === 401 || status === 403) return "key";

  // 너무 자주 불렀다. 잠시 뒤에 다시 하면 된다
  if (status === 429 || body.error?.status === "RESOURCE_EXHAUSTED") return "too-many";

  // 나머지는 저쪽 사정이라 아는 척하지 않는다
  return "unreachable";
}

/** 응답 몸통에서 모델이 적어 보낸 글자를 꺼낸다 */
// [F3][함수] textOf(payload): 응답 몸통에서 모델이 적어 보낸 글자를 꺼낸다
// 입력: payload(응답 JSON) → 처리: candidates[0].content.parts 를 이어 붙임 → 출력: 문자열
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
// [F4][함수] geminiRecipeGateway(apiKey, model): 키와 모델을 쥔 게이트웨이를 만든다
// 입력: apiKey(브라우저에 담아 둔 키) + model(속도에서 고른 이름)
// 출력: RecipeGateway (fromSpeech·fromDish·fromYoutube·fridgeIdeas·fromFridgeDish)
export function geminiRecipeGateway(apiKey: string, model: string): RecipeGateway {
  /**
   * 제미나이에 한 번 다녀온다. 가장 낮은 층이다.
   *
   * 어떤 틀로 받을지, 어떤 자세로 답하라고 할지는 부르는 쪽이 정한다.
   * 레시피 한 편과 냉장고 후보 목록은 받아 오는 모양이 다르지만
   * 주소·머리말·오류 갈래 나누기는 똑같아서, 그 똑같은 부분만 여기 둔다.
   */
  // [F5][함수] call(parts, system, schema): 제미나이에 한 번 다녀오는 가장 낮은 층
  // 입력: parts(보낼 조각들) + system(자세) + schema(받을 틀)
  // 처리: REST 호출 → 상태 확인 → 두 겹 JSON 풀기 → 출력: {ok, bag} 또는 까닭
  async function call(
    parts: unknown[],
    system: string,
    schema: unknown,
  ): Promise<
    | { ok: true; bag: Record<string, unknown> }
    | { ok: false; reason: Exclude<GatewayRecipe, { ok: true }>["reason"] }
  > {
    let res: Response;
    try {
      // [F6][외부] parts·system·schema ▷ POST generativelanguage…/generateContent → res
      // 키는 주소가 아니라 x-goog-api-key 머리말에 싣는다(기록에 안 남게)
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
          systemInstruction: { parts: [{ text: system }] },
          generationConfig: {
            // JSON 으로만 답하라고 못 박는다
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }),
      });
    } catch {
      // 인터넷이 끊겼거나 주소를 못 찾았다. 값이 틀린 것과는 다른 실패다
      // [F7][에러] 인터넷이 끊겼거나 주소를 못 찾음 → 'unreachable' 반환
      return { ok: false, reason: "unreachable" };
    }

    // 200 이 아니면 몸통에서 까닭을 읽어 본다
    // [F8][분기] 200 이 아님 → true: 몸통을 읽어 reasonFor(F2) 로 까닭을 정해 반환 / false: F9
    if (!res.ok) {
      // 오류 몸통이 JSON 이 아닐 수도 있어서 실패해도 넘어간다
      const body = (await res.json().catch(() => ({}))) as GeminiError;
      return { ok: false, reason: reasonFor(res.status, body) };
    }

    let parsed: unknown;
    try {
      // 몸통을 읽고, 그 안에 담긴 글자를 다시 JSON 으로 푼다 — 두 겹이다
      // [F9][흐름] res.json() → textOf(F3) → JSON.parse → parsed (두 겹이다)
      parsed = JSON.parse(textOf(await res.json()));
    } catch {
      // 모델이 JSON 이 아닌 것을 보냈다
      // [F10][에러] 모델이 JSON 이 아닌 것을 보냄 → 'shape' 반환
      return { ok: false, reason: "shape" };
    }

    // 객체가 아니면 칸을 꺼낼 수가 없다
    if (typeof parsed !== "object" || parsed === null) {
      return { ok: false, reason: "shape" };
    }

    // [F11][반환] {ok:true, bag} → ask(F12) 와 fridgeIdeas(F18) 가 받는다
    return { ok: true, bag: parsed as Record<string, unknown> };
  }

  /**
   * 레시피 한 편을 받아 온다.
   *
   * `sourceOf` 는 모델이 보낸 값을 보고 출처를 정하는 함수다. 안 주면
   * 도메인이 정한 기본값(쿡파일럿이 만든 것)이 그대로 남는다 —
   * 유튜브에서 옮겨 올 때만 원작자를 채워 넣으려고 뚫어 둔 구멍이다.
   */
  // [F12][함수] ask(parts, servings, sourceOf?): 레시피 한 편을 받아 온다
  // 입력: parts + servings + sourceOf(출처를 바꿔 달 함수) → 처리: call(F5) → 도메인 검사
  // 출력: GatewayRecipe
  async function ask(
    parts: unknown[],
    servings: number,
    sourceOf?: (bag: Record<string, unknown>) => Recipe["source"],
  ): Promise<GatewayRecipe> {
    // [F13][호출] parts + systemPrompt(F1) + RECIPE_SCHEMA → call(F5) → answer
    const answer = await call(parts, systemPrompt(servings), RECIPE_SCHEMA);

    // 다녀오다 걸렸으면 까닭을 그대로 올려 보낸다
    // [F14][분기] answer.ok → false: 까닭 그대로 반환 / true: F15
    if (!answer.ok) return answer;

    const parsed = answer.bag;

    /* 요리 이름을 못 알아들었을 때는 빈 title 로 오라고 일러 두었다.
       그건 모양이 틀린 것과 다르다 — 사람이 다시 말하면 풀린다 */
    // [F15][분기] title 이 빔(못 알아들었다는 약속) → true: 'unheard' 반환 / false: F16
    if (!parsed.title) {
      return { ok: false, reason: "unheard" };
    }

    // 칸을 하나씩 확인하는 일은 통째로 도메인에 맡긴다
    // [F16][호출] parsed → readRecipe(domain/recipe) → read (칸 검사는 통째로 도메인이 한다)
    const read = readRecipe(parsed, servings);

    // 걸렸으면 까닭을 그대로 올려 보낸다
    if (!read.ok) return { ok: false, reason: read.problem };

    /* 출처를 바꿔 달 일이 있으면 여기서 바꾼다. readRecipe 는 늘 "AI 가 만든 것"
       으로 적어 두는데, 유튜브에서 옮겨 온 것을 그렇게 두면 원작자가 사라진다 */
    // [F17][분기] sourceOf 가 주어짐(유튜브) → 출처를 바꿔 단다 / 없으면 도메인이 정한 값 그대로
    const recipe = sourceOf
      ? { ...read.recipe, source: sourceOf(parsed) }
      : read.recipe;

    // [F17b][반환] {ok:true, recipe} → plan-recipe 의 finish() 로 전달
    return { ok: true, recipe: recipe satisfies Recipe };
  }

  return {
    // [F18][함수] fromSpeech(clip, servings): 말소리를 듣고 레시피까지 한 번에 만든다
    // 입력: clip(base64 소리) + servings → 처리: inlineData 로 실어 ask(F12) → 출력: GatewayRecipe
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

    // [F19][함수] fromDish(dish, servings): 글로 적은 요리 이름으로 레시피를 만든다
    // 입력: dish + servings → 처리: 문장 하나로 ask(F12) → 출력: GatewayRecipe
    fromDish(dish: string, servings: number) {
      // 글로 적은 이름은 그대로 넘긴다
      return ask([{ text: `"${dish}" 레시피를 만들어 줘.` }], servings);
    },

    // [F20][함수] fromYoutube(url, servings): 유튜브 영상에서 레시피를 옮겨 온다
    // 입력: url + servings → 처리: fileData 로 영상 주소를 실어 ask(F12) + sourceOf 로 원작자 기록
    // 출력: GatewayRecipe (source.kind = 'youtube')
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
          /* 영상 제목도 함께 남긴다. 못 받아 왔으면 빈 글자로 두고,
             화면이 그때 제목 줄을 빼면 된다 — 없는 제목을 지어내는 것보다 낫다 */
          videoTitle:
            typeof bag.videoTitle === "string" ? bag.videoTitle.trim() : "",
          url,
        }),
      );
    },

    // [F21][함수] fridgeIdeas(items, servings): 가진 재료로 만들 수 있는 후보를 찾는다
    // 입력: items(재료 목록) + servings → 처리: IDEAS_SCHEMA 로 call(F5) → readFridgeIdeas
    // 출력: GatewayIdeas (후보 3~5개)
    async fridgeIdeas(items: readonly string[], servings: number): Promise<GatewayIdeas> {
      // [F22][호출] 재료 문장 + 후보용 자세 + IDEAS_SCHEMA → call(F5) → answer
      const answer = await call(
        [
          {
            text: [
              `지금 집에 이런 재료가 있어: ${items.join(", ")}`,
              `이 재료로 만들 수 있는 ${servings}인분 요리를 ${MIN_IDEAS}~${MAX_IDEAS}가지 추천해 줘.`,
              "서로 다른 갈래로 골라 줘. 찌개만 셋을 내놓지 마.",
              "why 에는 가진 재료를 어떻게 쓰는지 한 문장으로 적어 줘.",
              "missing 에는 이 요리를 하려면 더 사야 하는 것만 적어 줘.",
              "소금·간장·설탕·식용유처럼 집에 흔한 양념은 missing 에 넣지 마.",
              "가진 재료만으로 되는 요리면 missing 을 빈 배열로 둬.",
            ].join(NL),
          },
        ],
        // 후보를 고르는 일이라 레시피용 자세와 다르다. 여기서만 쓰는 말을 따로 준다
        [
          "너는 한국 가정식을 잘 아는 요리 도우미다.",
          "집에 있는 재료로 오늘 뭘 해 먹을지 골라 주는 일을 한다.",
          "재료도 순서도 적지 마. 지금은 후보만 고른다.",
          "만들 수 있는 요리가 하나도 없으면 ideas 를 빈 배열로 둬라.",
        ].join(NL),
        IDEAS_SCHEMA,
      );

      // [F23][분기] answer.ok → false: 까닭 반환('unheard' 는 여기 없으니 'shape' 로 바꾼다) / true: F24
      if (!answer.ok) {
        /* 후보 목록에는 "못 알아들었다" 가 없다. 재료를 글로 적어 넣었으니
           알아들을 것도 없기 때문이다. 그런 값이 오면 모양이 틀린 것으로 본다 */
        return {
          ok: false,
          reason: answer.reason === "unheard" ? "shape" : answer.reason,
        };
      }

      // 줄 하나하나를 걸러 내는 일은 도메인에 맡긴다
      // [F24][호출] answer.bag.ideas → readFridgeIdeas(domain/recipe) → ideas
      const ideas = readFridgeIdeas(answer.bag.ideas);

      // 하나도 안 남았으면 다른 재료로 다시 해 보라고 해야 한다
      // [F25][분기] 남은 후보 0개 → 'no-idea' / 있으면 {ok:true, ideas} → findFridgeIdeas 로 전달
      return ideas.length === 0 ? { ok: false, reason: "no-idea" } : { ok: true, ideas };
    },

    // [F26][함수] fromFridgeDish(dish, items, servings): 고른 후보의 레시피를 만든다
    // 입력: dish + items(가진 재료) + servings → 처리: 둘을 함께 실어 ask(F12) → 출력: GatewayRecipe
    fromFridgeDish(dish: string, items: readonly string[], servings: number) {
      return ask(
        [
          {
            text: [
              `지금 집에 이런 재료가 있어: ${items.join(", ")}`,
              `그 재료로 "${dish}" 를 만들려고 해. 레시피를 만들어 줘.`,
              "적어 준 재료를 되도록 많이 쓰고, 없는 재료는 꼭 필요한 것만 보태.",
              "집에 흔한 양념은 pantry 를 true 로 두어서 장 볼 때 빠지게 해 줘.",
            ].join(NL),
          },
        ],
        servings,
      );
    },
  };
}
