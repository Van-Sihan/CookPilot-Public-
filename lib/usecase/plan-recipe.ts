/**
 * 유스케이스 · "요리를 정하고 레시피를 받아 오기".
 *
 * 말로 시켰든 글로 적었든, 레시피 한 편을 받아서 다음 화면이 쓸 수 있게 담아 두는 일까지.
 * 제미나이라는 말은 이 파일에 한 번도 안 나온다 — RecipeGateway 뒤에 있다.
 */

import {
  clampServings,
  readFridgeItems,
  readYoutubeUrl,
  type FridgeIdea,
  type FridgeProblem,
  type Recipe,
  type RecipeProblem,
  type YoutubeProblem,
} from "@/lib/domain/recipe";

/**
 * 마이크로 받은 소리 한 토막.
 *
 * 브라우저의 Blob 을 그대로 넘기지 않는다. 그러면 이 유스케이스가 브라우저에서만
 * 돌 수 있게 되고, 나중에 서버에서 부를 길이 막힌다.
 */
export type AudioClip = {
  /** 소리를 base64 로 옮긴 것 */
  base64: string;
  /** 무슨 형식인지. "audio/wav" 처럼 적는다 */
  mimeType: string;
};

/** 레시피를 만들어 주는 곳이 지켜야 할 약속. 진짜 구현은 lib/adapter 에 있다 */
export type RecipeGateway = {
  /**
   * 말소리를 듣고 무슨 요리인지 알아낸 뒤, 그 레시피까지 한 번에 만들어 온다.
   *
   * 알아듣기와 레시피 만들기를 따로 두 번 부르지 않는 까닭 —
   * 두 번 다녀오면 그만큼 오래 걸리고, 중간에 알아들은 이름이 어긋나면
   * 엉뚱한 레시피가 온다. 한 번에 시키면 모델이 앞뒤를 같이 본다.
   */
  fromSpeech(clip: AudioClip, servings: number): Promise<GatewayRecipe>;

  /** 글로 적은 요리 이름으로 레시피를 만들어 온다 */
  fromDish(dish: string, servings: number): Promise<GatewayRecipe>;

  /**
   * 유튜브 영상에서 레시피를 옮겨 온다.
   *
   * 원작자를 함께 받아 와야 한다. 남의 영상에서 옮겨 놓고 우리 것인 양
   * 보여 주면 안 되기 때문에, 게이트웨이가 source 에 채널과 주소를 담아 준다.
   */
  fromYoutube(url: string, servings: number): Promise<GatewayRecipe>;

  /**
   * 지금 있는 재료로 만들 수 있는 요리 후보를 몇 개 찾아 온다.
   *
   * 레시피가 아니라 후보만 받아 오는 까닭 — 재료만 적었을 때 어떤 요리가 나올지는
   * 사람도 모른다. 하나를 골라 던져 주면 마음에 안 들 때 다시 적는 수밖에 없다.
   * 먼저 늘어놓고 고르게 한 다음, 고른 하나만 레시피로 만든다.
   */
  fridgeIdeas(items: readonly string[], servings: number): Promise<GatewayIdeas>;

  /** 후보 중 하나를 고른 뒤, 가진 재료를 살려서 그 요리의 레시피를 만들어 온다 */
  fromFridgeDish(
    dish: string,
    items: readonly string[],
    servings: number,
  ): Promise<GatewayRecipe>;
};

/** 냉장고 후보를 찾아 주는 곳이 돌려주는 대답 */
export type GatewayIdeas =
  | { ok: true; ideas: readonly FridgeIdea[] }
  /** 만들 수 있는 요리를 하나도 못 찾았다. 재료를 더 적어야 풀린다 */
  | { ok: false; reason: "no-idea" }
  | {
      ok: false;
      reason: Exclude<
        Exclude<GatewayRecipe, { ok: true }>["reason"],
        // 글로 적어 넣은 재료라 "못 알아들었다" 가 나올 자리가 없다
        "unheard"
      >;
    };

/** 레시피를 만들어 주는 곳이 돌려주는 대답 */
export type GatewayRecipe =
  | { ok: true; recipe: Recipe }
  /** 무슨 요리인지 못 알아들었다. 다시 말해 달라고 해야 한다 */
  | { ok: false; reason: "unheard" }
  /** 키가 없거나 거절당했다 */
  | { ok: false; reason: "key" }
  /** 모델이 보낸 값이 레시피 모양이 아니다 */
  | { ok: false; reason: RecipeProblem }
  /** 너무 자주 불렀다 */
  | { ok: false; reason: "too-many" }
  /** 다녀오지 못했다 */
  | { ok: false; reason: "unreachable" };

/** 정한 레시피를 담아 두는 곳이 지켜야 할 약속 */
export type RecipeDraftStore = {
  /** 지금 하려는 요리를 담아 둔다 */
  save(recipe: Recipe): void;
  /** 담아 둔 것을 꺼낸다. 없으면 null */
  load(): Recipe | null;
  /** 담아 둔 것을 버린다 */
  clear(): void;
  /** 바뀌면 알려 준다. 돌려주는 함수를 부르면 그만 본다 */
  subscribe(onChange: () => void): () => void;
};

/** 화면이 받아 보는 결과 */
export type PlanResult =
  | { ok: true; recipe: Recipe }
  | {
      ok: false;
      reason:
        | Exclude<GatewayRecipe, { ok: true }>["reason"]
        | "empty"
        // 주소·재료를 살펴보다 걸린 것들. 다녀오기 전에 여기서 끝난다
        | YoutubeProblem
        | FridgeProblem;
    };

/** 냉장고 후보를 찾은 결과. 화면이 받아 본다 */
export type IdeaResult =
  | { ok: true; ideas: readonly FridgeIdea[] }
  | {
      ok: false;
      reason: Exclude<GatewayIdeas, { ok: true }>["reason"] | FridgeProblem;
    };

/**
 * 말소리로 요리를 정한다.
 * 레시피를 받아 오고, 다음 화면이 쓸 수 있게 담아 두는 일까지 여기서 끝낸다.
 */
// [F1][함수] planFromSpeech(clip, servings, gateway, store): 말소리로 요리를 정한다
// 입력: clip(마이크 소리 base64) + servings + gateway + store → 처리: 길이 검사 → 모델 호출 → 저장
// 출력: PlanResult (비동기)
export async function planFromSpeech(
  clip: AudioClip,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  /* 소리가 거의 없으면 다녀와 봐야 "못 알아들었다" 만 온다.
     base64 는 원래 크기의 4/3 이라, 이 정도면 1초도 안 되는 소리다.
     미리 걸러야 사람이 헛되이 기다리지 않는다 */
  // [F2][분기] 소리가 너무 짧음 → true: 'unheard' 반환(다녀오지 않음) / false: F3
  if (clip.base64.length < 2000) return { ok: false, reason: "unheard" };

  // 인분은 도메인이 정한 범위 안으로 밀어 넣고 넘긴다
  // [F3][외부] clip → gateway.fromSpeech() ▷ 제미나이 generateContent → GatewayRecipe
  // [F3][호출] 그 결과 → finish(F14) → 저장까지 마치고 PlanResult 반환
  return finish(await gateway.fromSpeech(clip, clampServings(servings)), store);
}

/** 글로 적은 요리 이름으로 정한다. 말이 잘 안 통할 때 쓰는 길이다 */
// [F4][함수] planFromDish(dish, servings, gateway, store): 글로 적은 요리 이름으로 정한다
// 입력: dish + servings + gateway + store → 처리: 빈값 검사 → 모델 호출 → 저장 → 출력: PlanResult
export async function planFromDish(
  dish: string,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  // 앞뒤 빈칸을 떼고 본다
  // [F5][흐름] dish → trim() → name
  const name = dish.trim();

  // 아무것도 안 적었으면 다녀올 까닭이 없다
  // [F6][분기] name 이 빔 → true: 'empty' 반환 / false: F7
  if (name.length === 0) return { ok: false, reason: "empty" };

  // [F7][외부] name → gateway.fromDish() ▷ 제미나이 → 결과 → finish(F14)
  return finish(await gateway.fromDish(name, clampServings(servings)), store);
}

/**
 * 유튜브 영상에서 옮겨 온다.
 *
 * 주소가 유튜브인지는 도메인이 본다. 아무 주소나 넘기면 모델이
 * 못 여는 영상에서도 **그럴듯한 레시피를 지어낸다** — 원작자를 밝히겠다고
 * 만든 기능이 거짓말을 하게 된다.
 */
// [F8][함수] planFromYoutube(raw, servings, gateway, store): 유튜브 영상에서 옮겨 온다
// 입력: raw(주소) + servings + gateway + store → 처리: 주소 검사 → 모델 호출 → 저장 → 출력: PlanResult
export async function planFromYoutube(
  raw: string,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  // [F9][호출] raw → readYoutubeUrl(domain/recipe) → read
  const read = readYoutubeUrl(raw);

  // 안 되면 까닭만 올려 보낸다. 무슨 말로 보여 줄지는 화면이 고른다
  // [F10][분기] 유튜브 주소가 아님 → true: 까닭 반환(모델을 안 부름) / false: F11
  if (!read.ok) return { ok: false, reason: read.problem };

  // [F11][외부] read.url → gateway.fromYoutube() ▷ 제미나이가 영상을 직접 봄 → 결과 → finish(F14)
  return finish(await gateway.fromYoutube(read.url, clampServings(servings)), store);
}

/**
 * 냉장고에 있는 재료로 만들 수 있는 요리 후보를 찾는다. 첫 걸음이다.
 *
 * 여기서는 아무것도 담아 두지 않는다. 아직 고른 요리가 없기 때문이다 —
 * 이 자리에서 레시피를 담아 두면 사람이 안 고른 요리가 장보기 화면에 앉아 있게 된다.
 */
// [F12][함수] findFridgeIdeas(raw, servings, gateway): 냉장고 재료로 요리 후보를 찾는다 (첫 걸음)
// 입력: raw(재료 글) + servings + gateway → 처리: 재료 파싱 → 모델 호출 → 출력: IdeaResult
// 여기서는 아무것도 담아 두지 않는다 — 아직 사람이 고른 요리가 없다
export async function findFridgeIdeas(
  raw: string,
  servings: number,
  gateway: RecipeGateway,
): Promise<IdeaResult> {
  // [F13a][호출] raw → readFridgeItems(domain/recipe) → read
  const read = readFridgeItems(raw);

  // 재료가 모자라면 다녀올 것도 없다
  if (!read.ok) return { ok: false, reason: read.problem };

  // [F13b][외부] read.items → gateway.fridgeIdeas() ▷ 제미나이 → answer(후보 3~5개)
  const answer = await gateway.fridgeIdeas(read.items, clampServings(servings));

  // [F13c][반환] ideas → pick-cards 가 후보 카드로 그린다
  return answer.ok ? { ok: true, ideas: answer.ideas } : { ok: false, reason: answer.reason };
}

/**
 * 늘어놓은 후보 중 하나를 골랐을 때. 두 번째 걸음이다.
 *
 * 가진 재료를 다시 넘기는 까닭 — 요리 이름만 주면 모델이 흔한 재료로 레시피를 짠다.
 * 그러면 "냉장고를 부탁해" 라고 해 놓고 없는 것을 잔뜩 사 오게 된다.
 */
// [F13][함수] planFromFridgeIdea(dish, raw, servings, gateway, store): 고른 후보의 레시피를 만든다 (두 번째 걸음)
// 입력: dish(고른 요리 이름) + raw(가진 재료) + servings + gateway + store → 출력: PlanResult
export async function planFromFridgeIdea(
  dish: string,
  raw: string,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  // [F13d][호출] raw → readFridgeItems() → read (가진 재료를 다시 넘겨야 없는 재료를 안 쓴다)
  const read = readFridgeItems(raw);

  if (!read.ok) return { ok: false, reason: read.problem };

  // [F13e][외부] dish + read.items → gateway.fromFridgeDish() ▷ 제미나이 → 결과 → finish(F14)
  return finish(
    await gateway.fromFridgeDish(dish, read.items, clampServings(servings)),
    store,
  );
}

/** 받아 온 대답을 담아 두고 화면에 넘긴다. 두 길이 똑같이 하는 뒷일이라 한곳에 모았다 */
// [F14][함수] finish(answer, store): 받아 온 레시피를 담아 두고 화면에 넘긴다
// 입력: answer(GatewayRecipe) + store → 처리: 저장 시도(실패해도 진행) → 출력: PlanResult
function finish(answer: GatewayRecipe, store: RecipeDraftStore): PlanResult {
  // 안 됐으면 까닭만 그대로 올려 보낸다
  // [F15][분기] answer.ok → false: 까닭 그대로 반환 / true: F16
  if (!answer.ok) return { ok: false, reason: answer.reason };

  try {
    // 다음 화면(장보기)이 꺼내 쓸 수 있게 담아 둔다
    // [F16][외부] answer.recipe → store.save() ▷ localStorage(cookpilot.recipe-draft) 기록
    store.save(answer.recipe);
  } catch {
    /* 담지 못했어도 레시피 자체는 멀쩡하다. 여기서 막으면 아무것도 못 하게 되므로
       그대로 넘긴다 — 다음 화면에서 새로 고치면 사라진다는 것만 감수한다 */
  }

  // [F17][반환] {ok:true, recipe} → pick-cards·voice-console 이 /shop 으로 넘어간다
  return { ok: true, recipe: answer.recipe };
}

/** 담아 둔 레시피를 꺼낸다. 장보기·요리 화면이 이걸로 시작한다 */
// [F18][함수] findDraft(store): 담아 둔 레시피를 꺼낸다
// 입력: store → 처리: store.load() ▷ localStorage 읽기 → 출력: Recipe 또는 null
// [F18][반환] recipe → shop-shell · cook-shell · write-form 이 이 값으로 화면을 그린다
export function findDraft(store: RecipeDraftStore): Recipe | null {
  try {
    return store.load();
  } catch {
    // 못 읽는 상황은 "정해 둔 요리가 없다" 와 똑같이 본다
    return null;
  }
}

/** 담아 둔 레시피를 버린다. 새 요리를 시작할 때 쓴다 */
// [F19][함수] forgetDraft(store): 담아 둔 레시피를 버린다
// 입력: store → 처리: store.clear() ▷ localStorage 삭제 → 출력: 없음
export function forgetDraft(store: RecipeDraftStore): void {
  try {
    store.clear();
  } catch {
    // 못 버렸다고 알려 줘도 사람이 할 수 있는 일이 없다
  }
}

/** 담아 둔 레시피가 바뀌는지 지켜본다 */
// [F20][함수] watchDraft(store, onChange): 담아 둔 레시피가 바뀌는지 지켜본다
// 입력: store + onChange → 처리: store.subscribe() → 출력: '그만 보기' 함수
export function watchDraft(store: RecipeDraftStore, onChange: () => void) {
  return store.subscribe(onChange);
}
