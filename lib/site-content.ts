/**
 * 홈페이지에 나가는 글과 값. 문구만 고칠 일이 대부분이라 한 곳에 모아 둔다.
 * 화면 배치는 components/ 아래, 색과 여백은 app/globals.css 가 맡는다.
 */

import type { IconName } from "@/components/icons";

export const site = {
  name: "CookPilot",
  nameKo: "쿡파일럿",
  tagline: "손은 요리에, 레시피는 쿡파일럿에",
  description:
    "말로 따라 하는 AI 요리 비서. 젖은 손으로 화면을 만질 일이 없습니다.",
  band: "베타 참여자 모집 중 · 지금은 무료",
} as const;

export const navLinks = [
  { href: "#features", label: "기능" },
  { href: "#how", label: "사용 방법" },
  { href: "#pricing", label: "요금제" },
  { href: "#faq", label: "자주 묻는 질문" },
] as const;

/* ---------- 히어로 안의 대화 시연 ---------- */

export type Turn = {
  side: "me" | "ai";
  who: string;
  text: string;
  chip?: string;
  note?: string;
};

export const heroTalk: Turn[] = [
  { side: "me", who: "나", text: "다음 단계 알려줘" },
  {
    side: "ai",
    who: "쿡파일럿",
    text: "중불로 줄이고 3분만 더 볶아 주세요. 타이머 맞춰 둘게요.",
    chip: "타이머 3:00 시작됨",
  },
  {
    side: "me",
    who: "나",
    text: "아 잠깐, 소금은 얼마나?",
    note: "— 말하는 중에 끊어도 됩니다",
  },
  { side: "ai", who: "쿡파일럿", text: "반 큰술이요. 2인분 기준입니다." },
];

/* ---------- 기능 여섯 칸 ---------- */

export type Feature = {
  n: string;
  icon: IconName;
  title: string;
  body: string;
};

export const features: Feature[] = [
  {
    n: "01",
    icon: "mic",
    title: "말로 요리를 정합니다",
    body: "화면 한가운데가 마이크입니다. “김치볶음밥” 한마디면 재료와 순서가 바로 펼쳐집니다.",
  },
  {
    n: "02",
    icon: "play",
    title: "유튜브 영상을 레시피로",
    body: "영상 주소만 넣어 주세요. 되감기 없이 읽을 수 있는 단계별 레시피로 바뀝니다.",
  },
  {
    n: "03",
    icon: "fridge",
    title: "냉장고를 부탁해",
    body: "남은 재료를 적어 두면 그것만으로 만들 수 있는 요리를 골라 줍니다.",
  },
  {
    n: "04",
    icon: "timer",
    title: "단계마다 타이머가 따라옵니다",
    body: "“3분 볶기”가 나오면 타이머가 스스로 켜집니다. 손으로 맞출 필요가 없습니다.",
  },
  {
    n: "05",
    icon: "scale",
    title: "인분을 바꾸면 분량이 다시 계산됩니다",
    body: "2인분을 4인분으로 바꾸면 모든 재료가 함께 움직입니다. 컵·큰술도 그램으로.",
  },
  {
    n: "06",
    icon: "book",
    title: "표지를 만들어 서재에 꽂습니다",
    body: "완성한 요리는 표지 그림과 함께 남습니다. 다음에 말로 다시 꺼내 옵니다.",
  },
];

/* ---------- 번갈아 놓인 세 덩어리 ---------- */

export type Block = {
  id: string;
  /** 넓은 화면에서 글이 오른쪽에 오면 "right" */
  side: "left" | "right";
  art: "steps" | "shelf" | "cart";
  title: string;
  lead: string;
  points: string[];
};

export const blocks: Block[] = [
  {
    id: "convert",
    side: "right",
    art: "steps",
    title: "되감기는 이제 그만",
    lead: "유튜브 링크를 붙이거나 냉장고에 남은 재료를 말해 주세요. 영상의 말과 화면을 함께 읽어 재료와 순서가 정리된 레시피 한 장을 만듭니다.",
    points: [
      "유튜브 영상 → 단계별 레시피",
      "남은 재료만으로 만들 수 있는 요리 제안",
      "컵·큰술을 그램으로, 2인분을 4인분으로 자동 환산",
    ],
  },
  {
    id: "library",
    side: "left",
    art: "shelf",
    title: "해 먹은 요리가 쌓입니다",
    lead: "완성한 요리는 표지와 함께 서재에 꽂힙니다. “지난주에 만든 그 파스타”라고만 해도 다시 꺼내 옵니다.",
    points: [
      "요리마다 자동으로 만들어지는 표지",
      "말로 찾는 서재 검색",
      "레시피를 파일로 내려받아 보관",
    ],
  },
  {
    id: "cart",
    side: "right",
    art: "cart",
    title: "장보기까지 이어서",
    lead: "레시피에 필요한 재료 중 없는 것만 골라 목록으로 묶습니다. 그대로 쇼핑몰 검색으로 넘어가면 장보기가 끝납니다.",
    points: [
      "가진 재료와 없는 재료를 말로 구분",
      "부족한 것만 모아 한 장의 목록으로",
      "목록에서 바로 쇼핑몰 검색으로 연결",
    ],
  },
];

/* 삽화에 들어가는 자잘한 값들 */

export const recipeSteps = [
  { n: "01", t: "재료 손질", d: "양파 반 개를 채 썰어 주세요" },
  { n: "02", t: "볶기", d: "중불에서 3분", tm: "2:41", on: true },
  { n: "03", t: "면 삶기", d: "끓는 물에 8분" },
  { n: "04", t: "합치기", d: "면수 두 국자를 함께" },
] as const;

export const shelfBooks = [
  ["토마토", "파스타"],
  ["된장", "찌개"],
  ["계란", "말이"],
  ["김치", "볶음밥"],
  ["가지", "덮밥"],
] as const;

export const cartItems = [
  { nm: "올리브유", have: true },
  { nm: "마늘", have: true },
  { nm: "방울토마토", have: false },
  { nm: "바질", have: false },
  { nm: "파르미지아노", have: false },
] as const;

/* ---------- 요금제 ---------- */

export type Plan = {
  name: string;
  price: string;
  per: string;
  perks: string[];
  cta: string;
  recommended?: boolean;
};

export const plans: Plan[] = [
  {
    name: "맛보기",
    price: "₩0",
    per: "/ 월",
    perks: ["하루 음성 대화 15분", "레시피 저장 10개", "타이머·계량 환산"],
    cta: "무료로 시작하기",
  },
  {
    name: "홈셰프",
    price: "₩4,900",
    per: "/ 월",
    perks: [
      "음성 대화 무제한",
      "레시피 저장 무제한",
      "유튜브·냉장고 레시피 변환",
      "AI 표지 월 30장",
      "장보기 목록 연동",
    ],
    cta: "홈셰프 시작하기",
    recommended: true,
  },
  {
    name: "키친",
    price: "₩9,900",
    per: "/ 월",
    perks: [
      "홈셰프의 모든 기능",
      "가족 계정 4인",
      "영양 정보 분석",
      "레시피 공유 서재",
    ],
    cta: "키친 문의하기",
  },
];

/* ---------- 자주 묻는 질문 ---------- */

export const faqs = [
  {
    q: "정말 손을 안 대고 쓸 수 있나요?",
    a: "네. 처음 한 번 “시작”만 눌러 주시면 그 뒤로는 대화로만 진행합니다. 다음 단계로 넘기기, 분량 바꾸기, 타이머 맞추기 모두 말로 됩니다.",
  },
  {
    q: "앱을 설치해야 하나요?",
    a: "아닙니다. 웹 브라우저만 있으면 됩니다. 휴대폰, 태블릿, 노트북 어디서나 같은 주소로 들어오시면 서재도 그대로 이어집니다.",
  },
  // {
  //   q: "제 목소리가 저장되나요?",
  //   a: "저장하지 않습니다. 음성은 대답을 만드는 데만 쓰이고 곧바로 버려집니다. 서재에 남는 것은 레시피 글과 표지 그림뿐입니다.",
  // },
  {
    q: "API 키를 따로 발급받아야 하나요?",
    a: "요금제를 쓰시면 필요 없습니다. 직접 발급받은 키를 넣어 쓰실 수도 있고, 그때는 대화 한도가 없습니다. 키는 브라우저 안에만 있고 서버로 보내지 않습니다.",
  },
  {
    q: "유튜브 링크는 어떻게 레시피가 되나요?",
    a: "영상의 말과 화면을 함께 읽어 재료와 순서를 뽑아냅니다. 분량이 안 나오는 영상은 일반적인 기준으로 채우고 그 부분을 표시해 드립니다.",
  },
  {
    q: "언제든 해지할 수 있나요?",
    a: "네. 위약금이나 약정은 없습니다. 해지해도 모아 둔 레시피는 맛보기 한도 안에서 계속 보실 수 있고, 파일로 내려받을 수도 있습니다.",
  },
] as const;

export const footerLinks = [
  { href: "#", label: "이용약관" },
  { href: "#", label: "개인정보처리방침" },
  { href: "#", label: "문의하기" },
  { href: "#", label: "만든 사람들" },
] as const;
