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
  /**
   * 유튜브 영상에서 옮겨 온 것.
   *
   * 원작자와 주소만으로는 부족하다. 사람이 화면에서 보고 "아, 내가 넣은 그 영상이구나"
   * 하고 알아볼 수 있어야 하는데, 그러려면 **영상 제목과 미리보기 그림**이 있어야 한다.
   * 채널 이름만 적어 두면 우리가 지어낸 레시피와 겉모습이 다르지 않다.
   */
  | { kind: "youtube"; channel: string; url: string; videoTitle: string }
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
// [F1][함수] asText(value): 아무 값이나 글자로 받아 준다 (F3·F14 가 여러 번 부른다)
// 입력: unknown → 처리: 숫자면 문자열화, 글자면 trim → 출력: string
function asText(value: unknown): string {
  // 숫자가 와도 글자로 받아 준다. AI 가 분량을 숫자로만 보낼 때가 있다
  if (typeof value === "number") return String(value);

  // 글자면 앞뒤 빈칸만 떼어 낸다
  return typeof value === "string" ? value.trim() : "";
}

/** 값 하나를 분(minutes)으로 읽는다. 못 읽으면 undefined */
// [F2][함수] asMinutes(value): 아무 값이나 분(minutes)으로 받아 준다
// 입력: unknown → 처리: 숫자화 → 0 이하·1440 초과 거름 → 출력: number 또는 undefined
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
// [F3][함수] readRecipe(value, fallbackServings): 밖에서 온 값을 레시피로 받아 줄지 판정
// 입력: value(모델 응답 JSON 또는 저장소에서 꺼낸 값) + fallbackServings(화면에서 고른 인분)
// 처리: 칸마다 형 검사 → 이상한 줄은 버리고 살릴 수 있는 것만 모음 → 출력: RecipeRead
export function readRecipe(value: unknown, fallbackServings: number): RecipeRead {
  // 객체가 아니면 볼 것도 없다. null 도 typeof 로는 "object" 라서 따로 걸러 낸다
  // [F4][분기] 객체가 아님 → true: {ok:false, problem:'shape'} 반환 / false: F5
  if (typeof value !== "object" || value === null) {
    return { ok: false, problem: "shape" };
  }

  // 칸을 꺼내 보려고 이름 있는 자루로 한 번 옮긴다
  // [F5][흐름] value → bag(이름으로 칸을 꺼낼 수 있는 자루)
  const bag = value as Record<string, unknown>;

  // 이름이 없으면 화면에 뭘 크게 적을지 알 수 없다
  // [F6][호출] bag.title → asText(F1) → title
  // [F6][분기] title 이 빔 → 'shape' 반환 / 아니면 F7
  const title = asText(bag.title);
  if (title.length === 0) return { ok: false, problem: "shape" };

  /* 인분은 AI 가 빠뜨리는 일이 잦다. 그럴 때는 사람이 화면에서 고른 값을 그대로 쓴다 —
     여기서 1인분으로 되돌리면 사람이 고른 값이 말없이 사라진다 */
  // [F7][호출] bag.servings(없으면 fallbackServings) → clampServings(F16) → servings
  const servings = clampServings(Number(bag.servings) || fallbackServings);

  // 재료 목록이 배열이 아니면 더 볼 것이 없다
  // [F8][분기] ingredients 가 배열이 아님 → true: 'shape' 반환 / false: F9
  if (!Array.isArray(bag.ingredients)) return { ok: false, problem: "shape" };

  const ingredients: Ingredient[] = [];
  // [F9][반복] bag.ingredients 를 처음부터 끝까지 훑어 ingredients 배열에 쌓는다
  // [F9][분기] 줄이 객체가 아니거나 name 이 비면 그 줄만 건너뛴다(레시피 전체는 살린다)
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
  // [F10][분기] 남은 재료가 0개 → true: 'empty-ingredients' 반환 / false: F11
  if (ingredients.length === 0) return { ok: false, problem: "empty-ingredients" };

  // 순서 목록이 배열이 아니면 더 볼 것이 없다
  // [F11][분기] steps 가 배열이 아님 → true: 'shape' 반환 / false: F12
  if (!Array.isArray(bag.steps)) return { ok: false, problem: "shape" };

  const steps: Step[] = [];
  // [F12][반복] bag.steps 를 훑어 steps 배열에 쌓는다. 빈 걸음은 건너뛴다
  // [F12][호출] 줄마다 minutes → asMinutes(F2)
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
  // [F13][분기] 남은 걸음이 0개 → true: 'empty-steps' 반환 / false: F14
  if (steps.length === 0) return { ok: false, problem: "empty-steps" };

  // 여기까지 왔으면 화면에 넘겨도 되는 레시피다
  // [F14][호출] bag.source → readSource(F15) → 출처를 살려 낸다
  // [F14][반환] {ok:true, recipe} → gemini-recipe-gateway · browser-recipe-draft-store 로 전달
  return {
    ok: true,
    /* 출처는 값에 담겨 있으면 그대로 살린다.
       예전에는 여기서 늘 "쿡파일럿이 만든 것" 으로 덮어썼는데, 그러면
       유튜브에서 옮겨 온 레시피를 브라우저에 담았다 꺼내는 순간 원작자가 사라졌다 —
       장보기 화면이 "쿡파일럿이 만든 기본 레시피입니다" 라고 거짓말을 하게 된다 */
    recipe: { title, servings, ingredients, steps, source: readSource(bag.source) },
  };
}

/**
 * 값 하나를 레시피 출처로 받아 준다.
 *
 * 모르는 갈래이거나 있어야 할 칸이 빠져 있으면 "쿡파일럿이 만든 것" 으로 본다.
 * **없는 출처를 지어내는 것보다 우리 것이라고 하는 편이 안전하다** —
 * 반대로 하면 남의 이름을 잘못 붙이게 된다.
 */
// [F15][함수] readSource(value): 값 하나를 레시피 출처로 받아 준다
// 입력: value(저장소에 담겨 있던 source 칸) → 처리: 갈래별 필수 칸 확인 → 출력: RecipeSource
// [F15][분기] youtube(주소 필수) / shelf / community(chef 필수) / 그 밖 → {kind:'ai'}
export function readSource(value: unknown): RecipeSource {
  // 아예 없으면 우리가 만든 것이다. 말로 시켰거나 글로 적은 길이 여기로 온다
  if (typeof value !== "object" || value === null) return { kind: "ai" };

  const bag = value as Record<string, unknown>;

  if (bag.kind === "youtube") {
    const url = asText(bag.url);

    /* 주소가 없으면 원작자에게 돌아갈 길이 없다. 채널 이름만 남기면
       확인할 수 없는 이름을 적어 두는 꼴이라 차라리 출처를 안 밝힌다 */
    if (url.length === 0) return { kind: "ai" };

    return {
      kind: "youtube",
      channel: asText(bag.channel),
      url,
      // 제목은 없을 수 있다. 그 자리에 무슨 말을 적을지는 화면이 고른다
      videoTitle: asText(bag.videoTitle),
    };
  }

  if (bag.kind === "shelf") return { kind: "shelf" };

  if (bag.kind === "community") {
    const chef = asText(bag.chef);

    // 적은 사람을 모르면 커뮤니티에서 왔다고 밝힐 수가 없다
    return chef.length > 0 ? { kind: "community", chef } : { kind: "ai" };
  }

  return { kind: "ai" };
}

/** 인분 수를 우리가 다루는 범위 안으로 밀어 넣는다 */
// [F16][함수] clampServings(n): 인분 수를 1~12 안으로 민다
// 입력: n → 처리: 숫자 아니면 2, 맞으면 반올림 후 자름 → 출력: 인분 숫자
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
// [F17][함수] totalMinutes(recipe): 걸음마다 적힌 시간을 다 더한다
// 입력: recipe → 처리: steps.minutes 누적 → 출력: 분(숫자)
export function totalMinutes(recipe: Recipe): number {
  // [F18][반복] recipe.steps 전체를 훑어 sum 에 누적 → 화면의 '약 45분' 자리로
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
// [F19][함수] splitMinutes(total): 분을 시간과 분으로 가른다
// 입력: total(분) → 처리: 60으로 나눈 몫과 나머지 → 출력: {hours, minutes}
export function splitMinutes(total: number): { hours: number; minutes: number } {
  // 음수나 이상한 값이 와도 0으로 본다. 시간이 거꾸로 가는 레시피는 없다
  const n = Number.isFinite(total) && total > 0 ? Math.round(total) : 0;

  return { hours: Math.floor(n / 60), minutes: n % 60 };
}

/** 재료 중 사야 하는 것만 (집에 있는 것은 뺀다) */
// [F20][함수] toBuy(recipe): 사야 하는 재료만 고른다
// 입력: recipe → 처리: pantry 가 true 인 것 제외 → 출력: Ingredient[]
export function toBuy(recipe: Recipe): readonly Ingredient[] {
  // pantry 가 true 면 집에 있는 것으로 보고 목록에서 뺀다
  // [F21][반복] ingredients 전체를 훑어 집에 없는 것만 남긴다 → shop-shell 의 장바구니로
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
// [F22][함수] readYoutubeUrl(raw): 붙여넣은 것이 유튜브 주소인지 판정
// 입력: raw(pick-cards 입력칸) → 처리: URL 파싱 후 호스트 대조 → 출력: YoutubeRead
export function readYoutubeUrl(raw: string): YoutubeRead {
  const url = raw.trim();

  // [F23][분기] 빈 주소 → true: 'empty' 반환 / false: F24
  if (url.length === 0) return { ok: false, problem: "empty" };

  /* 주소 모양이 아니면 URL 이 던진다. 그건 유튜브가 아닌 것과 같이 본다 */
  // [F24][흐름] url → new URL() → hostname → www./m. 제거 → host
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\.|^m\./, "").toLowerCase();
  } catch {
    // [F25][에러] URL 로 못 읽음 → 'not-youtube' 반환 → planFromYoutube 가 화면에 알린다
    return { ok: false, problem: "not-youtube" };
  }

  // 유튜브가 쓰는 두 집 주소
  // [F26][흐름] host → 두 집 주소와 대조 → ok
  const ok = host === "youtube.com" || host === "youtu.be";

  // [F27][반환] ok 면 {ok:true, url} → planFromYoutube → gateway.fromYoutube 로 전달
  return ok ? { ok: true, url } : { ok: false, problem: "not-youtube" };
}

/**
 * 유튜브 주소에서 영상 번호만 뽑는다.
 *
 * 미리보기 그림 주소를 만들려고 뽑는다. 번호를 알면 그림 주소는 규칙으로 정해지므로
 * 따로 다녀올 필요가 없다 — 키도, 기다림도 없다.
 *
 * 세 가지 모양을 받는다.
 *   youtube.com/watch?v=ID · youtu.be/ID · youtube.com/shorts/ID
 */
// [F28][함수] youtubeVideoId(url): 유튜브 주소에서 영상 번호만 뽑는다
// 입력: url → 처리: 짧은 주소·쇼츠·?v= 세 모양 처리 후 11자 검사 → 출력: 영상 번호 또는 null
export function youtubeVideoId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // [F29][에러] URL 로 못 읽음 → null 반환 (F31 이 '그림 없음' 으로 다룬다)
    return null;
  }

  const host = parsed.hostname.replace(/^www\.|^m\./, "").toLowerCase();

  /* 짧은 주소는 길 자체가 번호다. 앞의 빗금을 떼면 된다 */
  const raw =
    host === "youtu.be"
      ? parsed.pathname.slice(1)
      : // 쇼츠와 임베드는 마지막 칸이 번호이고, 보통 주소는 ?v= 에 들어 있다
        /^\/(shorts|embed)\//.test(parsed.pathname)
        ? parsed.pathname.split("/")[2] ?? ""
        : parsed.searchParams.get("v") ?? "";

  /* 유튜브 번호는 열한 자다. 길이와 글자를 함께 보아야
     "youtu.be/" 뒤에 아무 글자나 붙인 주소로 엉뚱한 그림을 부르지 않는다 */
  return /^[\w-]{11}$/.test(raw) ? raw : null;
}

/** 미리보기 그림의 크기. 화면이 자리를 미리 잡아 두려면 알아야 하는 값이다 */
export const YOUTUBE_THUMB_W = 320;
export const YOUTUBE_THUMB_H = 180;

/**
 * 영상 미리보기 그림 주소.
 *
 * mqdefault 를 쓰는 까닭이 둘이다.
 *   · maxresdefault 는 올린 사람이 큰 그림을 안 넣었으면 404 가 나서 빈 자리가 생긴다.
 *   · hqdefault 는 4:3 이라 요즘 영상에는 위아래로 검은 띠가 붙는다.
 * mqdefault 는 320×180 짜리 16:9 이고 모든 영상에 있다.
 */
// [F30][함수] youtubeThumb(url): 영상 미리보기 그림 주소를 만든다
// 입력: url → 처리: youtubeVideoId(F28) 호출 후 주소 조립 → 출력: 그림 주소 또는 null
export function youtubeThumb(url: string): string | null {
  // [F31][호출] url → youtubeVideoId(F28) → id → 주소 조립 → youtube-source.tsx 로 전달
  const id = youtubeVideoId(url);

  return id ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : null;
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
// [F32][함수] readFridgeItems(raw): 냉장고에 적은 글자를 재료 목록으로 읽는다
// 입력: raw(pick-cards 의 여러 줄 칸) → 처리: 쉼표·줄바꿈으로 나눠 다듬기 → 출력: FridgeRead
export function readFridgeItems(raw: string): FridgeRead {
  const text = raw.trim();

  // [F33][분기] 빈 글 → true: 'empty' 반환 / false: F34
  if (text.length === 0) return { ok: false, problem: "empty" };

  // [F34][흐름] text → split(구분자) → map(trim) → filter(길이) → items
  const items = text
    // 쉼표·줄바꿈·가운뎃점·슬래시를 모두 칸막이로 본다
    .split(/[,\n·/]+/)
    .map((s) => s.trim())
    // 빈 칸과 지나치게 긴 것은 버린다. 긴 것은 재료가 아니라 문장이다
    .filter((s) => s.length > 0 && s.length <= 30);

  // 하나만 적으면 만들 수 있는 요리가 너무 넓어진다
  // [F35][분기] items 가 2개 미만 → true: 'too-few' 반환 / false: F36
  if (items.length < MIN_FRIDGE_ITEMS) return { ok: false, problem: "too-few" };

  // 스무 가지를 넘기면 물음이 길어지기만 하고 답이 나아지지 않는다
  // [F36][반환] 최대 20개로 자른 items → findFridgeIdeas · planFromFridgeIdea 로 전달
  return { ok: true, items: items.slice(0, 20) };
}

/**
 * 냉장고 재료로 만들 수 있다고 모델이 내놓은 요리 하나.
 *
 * 레시피가 아니다. **고르라고 늘어놓는 후보**다. 재료만 적었을 때 모델이
 * 요리 하나를 제 마음대로 골라 버리면 사람은 왜 그것이 나왔는지 알 수 없고,
 * 마음에 안 들어도 다시 적는 수밖에 없다. 그래서 먼저 몇 개를 보여 주고 고르게 한다.
 *
 * 레시피 전체를 후보마다 만들지 않는 까닭 — 다섯 편을 다 만들면 그만큼 오래 걸리고
 * 네 편은 버려진다. 고른 하나만 그때 만든다.
 */
export type FridgeIdea = {
  /** 요리 이름 */
  title: string;
  /** 왜 이걸 골랐는지 한 줄. 가진 재료를 어떻게 쓰는지가 들어가야 쓸모가 있다 */
  why: string;
  /** 대략 몇 분 걸리는지. 고를 때 가장 먼저 보는 값이다 */
  minutes: number;
  /**
   * 사야 하는 것.
   * 비어 있으면 "가진 재료만으로 됩니다" 가 된다 — 그 말이 고르는 데 가장 큰 힘을 준다.
   */
  missing: readonly string[];
};

/** 몇 개를 보여 줄지. 셋보다 적으면 고를 맛이 없고, 다섯을 넘으면 읽기 힘들다 */
export const MIN_IDEAS = 3;
export const MAX_IDEAS = 5;

/**
 * 모델이 보내온 후보 목록을 받아 준다.
 *
 * 레시피와 같은 자세로 본다 — 한 줄이 이상하면 그 줄만 버리고 나머지는 살린다.
 * 후보는 어차피 여럿이라, 하나가 빠져도 사람은 나머지 중에서 고르면 된다.
 */
// [F37][함수] readFridgeIdeas(value): 모델이 보낸 후보 목록을 받아 준다
// 입력: value(모델 응답의 ideas 칸) → 처리: 줄마다 형 검사, 이상하면 그 줄만 버림 → 출력: FridgeIdea[]
export function readFridgeIdeas(value: unknown): readonly FridgeIdea[] {
  // 배열이 아니면 고를 것이 없다
  // [F38][분기] 배열이 아님 → true: 빈 배열 반환 / false: F39
  if (!Array.isArray(value)) return [];

  const ideas: FridgeIdea[] = [];

  // [F39][반복] value 를 훑어 ideas 에 쌓는다. MAX_IDEAS(5)개가 차면 멈춘다
  // [F39][분기] 객체가 아니거나 title 이 비면 그 줄만 건너뛴다
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;

    const bag = raw as Record<string, unknown>;
    const title = asText(bag.title);

    // 이름 없는 후보는 화면에 뭘 적을지 알 수 없다
    if (title.length === 0) continue;

    ideas.push({
      title,
      // 까닭은 없을 수도 있다. 없다고 후보 자체를 버릴 일은 아니다
      why: asText(bag.why),
      /* 시간은 asMinutes 가 걸러 준다. 못 읽으면 0 으로 두고,
         화면이 그때 시간 줄을 빼면 된다 — 지어낸 숫자를 적는 것보다 낫다 */
      minutes: asMinutes(bag.minutes) ?? 0,
      missing: Array.isArray(bag.missing)
        ? bag.missing.map(asText).filter((t) => t.length > 0)
        : [],
    });

    // 너무 많이 오면 화면이 길어진다. 위에서 자른다
    if (ideas.length >= MAX_IDEAS) break;
  }

  // [F40][반환] ideas → gemini-recipe-gateway.fridgeIdeas → findFridgeIdeas → pick-cards 로 전달
  return ideas;
}
