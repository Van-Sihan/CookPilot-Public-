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

  /** 지금 있는 재료로 만들 수 있는 요리를 찾아 온다 */
  fromFridge(items: readonly string[], servings: number): Promise<GatewayRecipe>;
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

/**
 * 말소리로 요리를 정한다.
 * 레시피를 받아 오고, 다음 화면이 쓸 수 있게 담아 두는 일까지 여기서 끝낸다.
 */
export async function planFromSpeech(
  clip: AudioClip,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  /* 소리가 거의 없으면 다녀와 봐야 "못 알아들었다" 만 온다.
     base64 는 원래 크기의 4/3 이라, 이 정도면 1초도 안 되는 소리다.
     미리 걸러야 사람이 헛되이 기다리지 않는다 */
  if (clip.base64.length < 2000) return { ok: false, reason: "unheard" };

  // 인분은 도메인이 정한 범위 안으로 밀어 넣고 넘긴다
  return finish(await gateway.fromSpeech(clip, clampServings(servings)), store);
}

/** 글로 적은 요리 이름으로 정한다. 말이 잘 안 통할 때 쓰는 길이다 */
export async function planFromDish(
  dish: string,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  // 앞뒤 빈칸을 떼고 본다
  const name = dish.trim();

  // 아무것도 안 적었으면 다녀올 까닭이 없다
  if (name.length === 0) return { ok: false, reason: "empty" };

  return finish(await gateway.fromDish(name, clampServings(servings)), store);
}

/**
 * 유튜브 영상에서 옮겨 온다.
 *
 * 주소가 유튜브인지는 도메인이 본다. 아무 주소나 넘기면 모델이
 * 못 여는 영상에서도 **그럴듯한 레시피를 지어낸다** — 원작자를 밝히겠다고
 * 만든 기능이 거짓말을 하게 된다.
 */
export async function planFromYoutube(
  raw: string,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  const read = readYoutubeUrl(raw);

  // 안 되면 까닭만 올려 보낸다. 무슨 말로 보여 줄지는 화면이 고른다
  if (!read.ok) return { ok: false, reason: read.problem };

  return finish(await gateway.fromYoutube(read.url, clampServings(servings)), store);
}

/** 냉장고에 있는 재료로 찾는다 */
export async function planFromFridge(
  raw: string,
  servings: number,
  gateway: RecipeGateway,
  store: RecipeDraftStore,
): Promise<PlanResult> {
  const read = readFridgeItems(raw);

  if (!read.ok) return { ok: false, reason: read.problem };

  return finish(await gateway.fromFridge(read.items, clampServings(servings)), store);
}

/** 받아 온 대답을 담아 두고 화면에 넘긴다. 두 길이 똑같이 하는 뒷일이라 한곳에 모았다 */
function finish(answer: GatewayRecipe, store: RecipeDraftStore): PlanResult {
  // 안 됐으면 까닭만 그대로 올려 보낸다
  if (!answer.ok) return { ok: false, reason: answer.reason };

  try {
    // 다음 화면(장보기)이 꺼내 쓸 수 있게 담아 둔다
    store.save(answer.recipe);
  } catch {
    /* 담지 못했어도 레시피 자체는 멀쩡하다. 여기서 막으면 아무것도 못 하게 되므로
       그대로 넘긴다 — 다음 화면에서 새로 고치면 사라진다는 것만 감수한다 */
  }

  return { ok: true, recipe: answer.recipe };
}

/** 담아 둔 레시피를 꺼낸다. 장보기·요리 화면이 이걸로 시작한다 */
export function findDraft(store: RecipeDraftStore): Recipe | null {
  try {
    return store.load();
  } catch {
    // 못 읽는 상황은 "정해 둔 요리가 없다" 와 똑같이 본다
    return null;
  }
}

/** 담아 둔 레시피를 버린다. 새 요리를 시작할 때 쓴다 */
export function forgetDraft(store: RecipeDraftStore): void {
  try {
    store.clear();
  } catch {
    // 못 버렸다고 알려 줘도 사람이 할 수 있는 일이 없다
  }
}

/** 담아 둔 레시피가 바뀌는지 지켜본다 */
export function watchDraft(store: RecipeDraftStore, onChange: () => void) {
  return store.subscribe(onChange);
}
