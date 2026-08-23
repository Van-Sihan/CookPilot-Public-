/**
 * 도메인 · 레시피 한 편.
 *
 * 이 파일은 레시피가 "어떻게 생겼는지" 와 "인분을 바꾸면 어떻게 되는지" 만 안다.
 * 누가 만들어 주는지(제미나이인지 사람이 적은 것인지)도, 어디에 담아 두는지도 모른다.
 *
 * 바깥에서 들어온 값을 그대로 믿지 않는 것이 이 파일의 큰 몫이다.
 * 레시피는 AI 가 만들어 보내는 것이라, 칸이 빠지거나 숫자 자리에 글자가 올 수 있다.
 * 그대로 화면에 넘기면 요리 도중에 화면이 깨진다 — 불 앞에 서 있는 사람에게는 최악이다.
 */

/** 재료 한 줄 */
export type Ingredient = {
  /** 재료 이름. 장보기 목록과 검색어로 함께 쓴다 */
  name: string;
  /** 얼마나. "300g", "1/2개" 처럼 숫자와 단위가 붙은 글자다 */
  amount: string;
  /**
   * 소금·간장처럼 집에 늘 있는 것인지.
   * 장보기 화면이 이 값을 보고 체크를 미리 빼 둔다 — 있는 걸 또 사게 하면 안 된다.
   */
  pantry: boolean;
};

/** 조리 순서 한 걸음 */
export type Step = {
  /** 무엇을 하는지. 한 문장으로 끝나야 한다 — 불 앞에서 긴 글은 못 읽는다 */
  text: string;
  /**
   * 이 걸음에 걸리는 시간(분). 없으면 시간과 상관없는 걸음이다.
   * 요리 화면이 이 값으로 타이머를 미리 채워 준다.
   */
  minutes?: number;
};

/** 레시피 한 편 */
export type Recipe = {
  /** 요리 이름 */
  title: string;
  /** 몇 인분 기준인지 */
  servings: number;
  /** 재료 목록 */
  ingredients: readonly Ingredient[];
  /** 조리 순서 */
  steps: readonly Step[];
  /**
   * 이 레시피가 어디서 왔는지.
   * 유튜브에서 옮겨 왔으면 원작자를 밝혀야 하고, 우리가 만든 것이면 그렇다고 적어야 한다.
   * 출처를 지어내지 않으려고 도메인에 자리를 만들어 둔다.
   */
  source: RecipeSource;
};

/** 레시피의 출처 */
export type RecipeSource =
  /** 쿡파일럿이 만든 기본 레시피 */
  | { kind: "ai" }
  /** 유튜브 영상에서 옮겨 온 것. 원작자와 주소를 반드시 함께 남긴다 */
  | { kind: "youtube"; channel: string; url: string }
  /** 서재에서 꺼낸, 예전에 저장해 둔 것 */
  | { kind: "shelf" }
  /** 커뮤니티에 올라온 글에서 가져온 것. 적은 사람 이름을 함께 남긴다 */
  | { kind: "community"; chef: string };

/** 레시피를 못 읽은 까닭. 화면에 그대로 띄우지 않고 문장은 화면이 고른다 */
export type RecipeProblem = "shape" | "empty-steps" | "empty-ingredients";

/** 레시피를 읽은 결과 */
export type RecipeRead =
  | { ok: true; recipe: Recipe }
  | { ok: false; problem: RecipeProblem };

/** 가장 적은 인분. 0인분 요리는 없다 */
export const MIN_SERVINGS = 1;

/** 가장 많은 인분. 집밥으로는 이만하면 넉넉하고, 위를 막아 두면 잘못 눌러도 안 튄다 */
export const MAX_SERVINGS = 12;

/** 값 하나가 글자인지 보고, 아니면 빈 글자로 바꿔 준다 */
function asText(value: unknown): string {
  // 숫자가 와도 글자로 받아 준다. AI 가 분량을 숫자로만 보낼 때가 있다
  if (typeof value === "number") return String(value);

  // 글자면 앞뒤 빈칸만 떼어 낸다
  return typeof value === "string" ? value.trim() : "";
}

/** 값 하나를 분(minutes)으로 읽는다. 못 읽으면 undefined */
function asMinutes(value: unknown): number | undefined {
  // 글자로 온 숫자도 받아 준다
  const n = typeof value === "string" ? Number(value) : value;

  // 숫자가 아니거나 0 이하면 시간 정보가 없는 것으로 본다
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return undefined;

  // 하루를 넘는 걸음은 이 앱이 다룰 일이 아니다. 잘못 온 값으로 본다
  return n > 1440 ? undefined : Math.round(n);
}

/**
 * AI 가 보내온 값을 레시피로 받아 줄지 살펴본다.
 *
 * 칸 하나하나를 다 확인한다. AI 는 시키는 대로 하다가도 한 번씩 모양을 어긴다.
 * 그때 화면이 깨지는 것보다, 여기서 걸러 내고 "다시 해 보세요" 라고 말하는 편이 낫다.
 */
export function readRecipe(value: unknown, fallbackServings: number): RecipeRead {
  // 객체가 아니면 볼 것도 없다. null 도 typeof 로는 "object" 라서 따로 걸러 낸다
  if (typeof value !== "object" || value === null) {
    return { ok: false, problem: "shape" };
  }

  // 칸을 꺼내 보려고 이름 있는 자루로 한 번 옮긴다
  const bag = value as Record<string, unknown>;

  // 이름이 없으면 화면에 뭘 크게 적을지 알 수 없다
  const title = asText(bag.title);
  if (title.length === 0) return { ok: false, problem: "shape" };

  /* 인분은 AI 가 빠뜨리는 일이 잦다. 그럴 때는 사람이 화면에서 고른 값을 그대로 쓴다 —
     여기서 1인분으로 되돌리면 사람이 고른 값이 말없이 사라진다 */
  const servings = clampServings(Number(bag.servings) || fallbackServings);

  // 재료 목록이 배열이 아니면 더 볼 것이 없다
  if (!Array.isArray(bag.ingredients)) return { ok: false, problem: "shape" };

  const ingredients: Ingredient[] = [];
  for (const raw of bag.ingredients) {
    // 줄 하나가 객체가 아니면 그 줄만 건너뛴다. 한 줄 때문에 레시피를 통째로 버릴 일은 아니다
    if (typeof raw !== "object" || raw === null) continue;

    const item = raw as Record<string, unknown>;
    const name = asText(item.name);

    // 이름 없는 재료는 장보기 목록에 올릴 수도, 검색할 수도 없다
    if (name.length === 0) continue;

    ingredients.push({
      name,
      // 분량은 없을 수도 있다. "약간" 처럼 적히는 재료가 실제로 있다
      amount: asText(item.amount) || "약간",
      // 안 적혀 있으면 사야 하는 것으로 본다. 빠뜨리고 못 사는 쪽이 더 나쁘다
      pantry: item.pantry === true,
    });
  }

  // 재료가 하나도 안 남았으면 장보기 화면이 빈 채로 나온다
  if (ingredients.length === 0) return { ok: false, problem: "empty-ingredients" };

  // 순서 목록이 배열이 아니면 더 볼 것이 없다
  if (!Array.isArray(bag.steps)) return { ok: false, problem: "shape" };

  const steps: Step[] = [];
  for (const raw of bag.steps) {
    /* 걸음은 글자로 올 수도 있고 {text, minutes} 로 올 수도 있다.
       둘 다 받아 준다 — 모양을 하나로 못 박아 봐야 AI 가 어길 뿐이다 */
    const text = typeof raw === "string" ? raw.trim() : asText((raw as Record<string, unknown>)?.text);

    // 빈 걸음은 화면에 아무것도 못 그린다
    if (text.length === 0) continue;

    steps.push({
      text,
      // 시간이 적혀 있으면 타이머를 미리 채워 줄 수 있다
      minutes:
        typeof raw === "string"
          ? undefined
          : asMinutes((raw as Record<string, unknown>).minutes),
    });
  }

  // 순서가 없으면 요리를 안내할 수가 없다
  if (steps.length === 0) return { ok: false, problem: "empty-steps" };

  // 여기까지 왔으면 화면에 넘겨도 되는 레시피다
  return {
    ok: true,
    recipe: { title, servings, ingredients, steps, source: { kind: "ai" } },
  };
}

/** 인분 수를 우리가 다루는 범위 안으로 밀어 넣는다 */
export function clampServings(n: number): number {
  // 숫자로 못 읽는 값이 오면 두 사람 기준으로 본다. 집밥에서 가장 흔한 수다
  if (!Number.isFinite(n)) return 2;

  // 아래위를 잘라 낸다. 소수 인분은 없으니 반올림한다
  return Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, Math.round(n)));
}

/**
 * 걸음마다 적힌 시간을 다 더한 값(분).
 *
 * 시간이 안 적힌 걸음은 0으로 센다. 그런 걸음은 "썬다", "섞는다" 처럼
 * 시간과 상관없는 일이라 여기 끼워 넣을 값이 없다.
 */
export function totalMinutes(recipe: Recipe): number {
  return recipe.steps.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
}

/**
 * 분을 시간과 분으로 나눈다.
 *
 * 하룻밤 재우는 레시피는 다 더하면 900분을 넘는다. "925분" 은 숫자로는 맞지만
 * 사람이 그 자리에서 몇 시간인지 셈해야 하는 값이라 쓸모가 없다.
 *
 * 여기서는 나누기만 한다. "15시간 25분" 이라고 쓸지 "15h 25m" 이라고 쓸지는
 * 화면이 정한다 — 도메인이 한국어를 쥐고 있으면 다른 말로 못 바꾼다.
 */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  // 음수나 이상한 값이 와도 0으로 본다. 시간이 거꾸로 가는 레시피는 없다
  const n = Number.isFinite(total) && total > 0 ? Math.round(total) : 0;

  return { hours: Math.floor(n / 60), minutes: n % 60 };
}

/** 재료 중 사야 하는 것만 (집에 있는 것은 뺀다) */
export function toBuy(recipe: Recipe): readonly Ingredient[] {
  // pantry 가 true 면 집에 있는 것으로 보고 목록에서 뺀다
  return recipe.ingredients.filter((i) => !i.pantry);
}

/** 유튜브 주소를 못 받아 준 까닭 */
export type YoutubeProblem = "empty" | "not-youtube";

/** 유튜브 주소를 살펴본 결과 */
export type YoutubeRead =
  | { ok: true; url: string }
  | { ok: false; problem: YoutubeProblem };

/**
 * 붙여넣은 것이 유튜브 주소인지 본다.
 *
 * 아무 주소나 모델에 넘기지 않는 까닭이 있다. 모델은 못 여는 주소를 받아도
 * **그럴듯한 레시피를 지어낸다.** 원작자를 밝히겠다고 만든 기능인데
 * 있지도 않은 영상에서 옮겨 온 것처럼 되면 안 하느니만 못하다.
 *
 * 짧은 주소(youtu.be), 모바일(m.youtube.com), 쇼츠까지 받는다 —
 * 사람이 복사해 오는 주소가 그 셋 중 하나다.
 */
export function readYoutubeUrl(raw: string): YoutubeRead {
  const url = raw.trim();

  if (url.length === 0) return { ok: false, problem: "empty" };

  /* 주소 모양이 아니면 URL 이 던진다. 그건 유튜브가 아닌 것과 같이 본다 */
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, "").toLowerCase();
  } catch {
    return { ok: false, problem: "not-youtube" };
  }

  // 유튜브가 쓰는 두 집 주소
  const ok = host === "youtube.com" || host === "youtu.be";

  return ok ? { ok: true, url } : { ok: false, problem: "not-youtube" };
}

/** 냉장고 재료를 못 받아 준 까닭 */
export type FridgeProblem = "empty" | "too-few";

/** 냉장고 재료를 살펴본 결과 */
export type FridgeRead =
  | { ok: true; items: readonly string[] }
  | { ok: false; problem: FridgeProblem };

/** 재료를 적어도 이만큼은 적어야 요리를 찾을 수 있다 */
export const MIN_FRIDGE_ITEMS = 2;

/**
 * 냉장고에 있다고 적은 것을 재료 목록으로 읽는다.
 *
 * 쉼표든 줄바꿈이든 가운뎃점이든 다 나눠 준다. 사람마다 적는 방식이 달라서
 * 한 가지만 받으면 "두부 계란 김치" 가 재료 하나로 들어간다.
 */
export function readFridgeItems(raw: string): FridgeRead {
  const text = raw.trim();

  if (text.length === 0) return { ok: false, problem: "empty" };

  const items = text
    // 쉼표·줄바꿈·가운뎃점·슬래시를 모두 칸막이로 본다
    .split(/[,\n·/]+/)
    .map((s) => s.trim())
    // 빈 칸과 지나치게 긴 것은 버린다. 긴 것은 재료가 아니라 문장이다
    .filter((s) => s.length > 0 && s.length <= 30);

  // 하나만 적으면 만들 수 있는 요리가 너무 넓어진다
  if (items.length < MIN_FRIDGE_ITEMS) return { ok: false, problem: "too-few" };

  // 스무 가지를 넘기면 물음이 길어지기만 하고 답이 나아지지 않는다
  return { ok: true, items: items.slice(0, 20) };
}
