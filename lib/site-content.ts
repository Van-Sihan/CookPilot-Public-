/**
 * 화면에 나오는 글과 값을 몽땅 모아 둔 곳.
 * 고칠 일이 있으면 대부분 글자만 바꾸면 되니까 한곳에 모아 두었다.
 * 무엇을 어디에 놓을지는 components/ 가, 색과 여백은 app/globals.css 가 맡는다.
 */

import type { IconName } from "@/components/icons";
/* 비밀번호 길이 안내 문구에 쓴다. 숫자를 여기 또 적어 두면
   규칙만 고쳤을 때 문구가 거짓말이 되므로 도메인이 정한 값을 그대로 끌어다 쓴다 */
import { MIN_PASSWORD_LENGTH } from "@/lib/domain/credentials";
/* 닉네임 길이도 마찬가지다. 문구에 숫자를 직접 적으면 규칙만 고쳤을 때 거짓말이 된다 */
import { MAX_DISPLAY_NAME, MIN_DISPLAY_NAME } from "@/lib/domain/display-name";
/* 탭의 속이름은 도메인이 정한다. 여기서는 그 이름에 부를 말만 붙인다 */
import { matchesQuery, type CommunityTab } from "@/lib/domain/community-tab";
/* 말투·속도·계량 단위의 속이름도 마찬가지로 도메인이 정한다.
   여기서 이름을 새로 지어 버리면 저장된 값과 화면이 서로 다른 말을 쓰게 된다 */
import type { AnswerSpeed } from "@/lib/domain/gemini-model";
import type { VoiceGender, VoiceTone } from "@/lib/domain/voice-tone";
import type { MeasureUnit } from "@/lib/domain/measure";

/** 서비스 이름과 한 줄 소개. 제목도, 맨 아랫부분도, 링크 미리보기도 전부 여기를 보고 쓴다 */
export const site = {
  // 영어 이름. 로고 옆과 링크 미리보기에 쓴다
  name: "CookPilot",
  // 한글 이름. 본문과 제목에서는 이쪽을 쓴다
  nameKo: "쿡파일럿",
  // 이게 무슨 물건인지 한 줄로 못 박는 말
  tagline: "손은 요리에, 레시피는 쿡파일럿에",
  // 검색 결과와 링크 미리보기에 같이 나가는 소개
  description:
    "말로 따라 하는 AI 요리 비서. 젖은 손으로 화면을 만질 일이 없습니다.",
  // 맨 위 띠에 걸리는 알림. 여기만 고치면 띠에 쓰인 말이 바뀐다
  band: "베타 참여자 모집 중",
  // 값을 여기서 못 박아 둬서 다른 데서 실수로 바꾸지 못하게 한다
} as const;

/** 맨 윗부분 메뉴. 전부 같은 페이지 안에서 아래로 내려가는 링크다 */
export const navLinks = [
  { href: "#features", label: "기능" },
  { href: "#how", label: "사용 방법" },
  { href: "#pricing", label: "요금제" },
  { href: "#faq", label: "자주 묻는 질문" },
  /* 여기만 다른 화면으로 나가는 길이다. 나머지는 같은 페이지 안에서 내려가는 링크다 */
  { href: "/community", label: "커뮤니티" },
] as const;

/* ---------- 히어로 안의 대화 시연 ---------- */

/** 주고받는 말 한 마디 */
export type Turn = {
  /** 말풍선을 어느 쪽에 붙일지. 내 말은 오른쪽, 쿡파일럿 말은 왼쪽 */
  side: "me" | "ai";
  /** 말풍선 위에 적히는, 누가 한 말인지 */
  who: string;
  /** 말풍선 본문 */
  text: string;
  /** 그 말 때문에 실제로 일어난 일. 타이머가 켜지는 것처럼 눈에 보이는 게 있을 때만 붙인다 */
  chip?: string;
  /** 곁다리 설명. "말을 끊어도 된다" 같은 걸 알려 줄 때 쓴다 */
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

/** 기능 한 칸에 들어가는 것들 */
export type Feature = {
  /** 01, 02 … 같은 번호. 눈으로 쭉 훑을 때 자리를 잡아 준다 */
  n: string;
  /** 칸 왼쪽 위에 그릴 아이콘 이름. components/icons.tsx 가 아는 이름만 쓸 수 있다 */
  icon: IconName;
  /** 기능 이름 */
  title: string;
  /** 기능을 설명하는 한두 문장 */
  body: string;
};

export const features: Feature[] = [
  {
    n: "01",
    icon: "mic",
    title: "말로 정하는 요리 레시피",
    body: "마이크에 “김치볶음밥”이라고 말만 하세요. 필요한 재료와 조리 순서가 한눈에 펼쳐집니다.",
  },
  {
    n: "02",
    icon: "play",
    title: "유튜브 영상을 한눈에 보는 레시피로",
    body: "유튜브 영상 주소만 입력하세요. 영상 오가는 번거로움 없이 단계별 조리법만 깔끔하게 정리해 드립니다.",
  },
  {
    n: "03",
    icon: "fridge",
    title: "냉장고 속 재료 맞춤 추천",
    body: "남은 재료를 입력하면 AI가 지금 바로 만들 수 있는 근사한 요리를 추천해 줍니다.",
  },
  {
    n: "04",
    icon: "timer",
    title: "조리 단계에 맞춘 자동 타이머",
    body: "“3분 볶기” 단계가 되면 타이머가 자동으로 실행됩니다. 젖은 손으로 터치할 필요가 없습니다.",
  },
  {
    n: "05",
    icon: "scale",
    title: "인원수에 맞춘 자동 계량",
    body: "2인분에서 4인분으로 변경하면, 그에 맞춰 모든 재료의 계량이 자동으로 계산됩니다.",
  },
  {
    n: "06",
    icon: "book",
    title: "나만의 레시피 서재 완성",
    body: "완성된 요리는 전용 커버와 함께 내 서재에 보관됩니다. 나만의 요리 도서관을 만들어 보세요.",
  },
];

/* ---------- 번갈아 놓인 세 덩어리 ---------- */

/** 글과 그림이 좌우로 놓이는 덩어리 하나 */
export type Block = {
  /** 링크를 눌러 곧장 여기로 내려올 수 있게 붙여 두는 이름표 */
  id: string;
  /** 화면이 넓을 때 글이 오른쪽에 놓이면 "right" */
  side: "left" | "right";
  /** 어떤 그림을 그릴지. components/showcase.tsx 에 적힌 이름과 똑같아야 한다 */
  art: "steps" | "shelf" | "cart";
  /** 덩어리 제목 */
  title: string;
  /** 제목을 풀어서 설명해 주는 글 */
  lead: string;
  /** 짧게 끊어 적은 중요한 점들 */
  points: string[];
};

export const blocks: Block[] = [
  {
    id: "convert",
    side: "right",
    art: "steps",
    title: "뒤로가기는 이제 그만",
    lead: "유튜브 링크를 붙이거나 냉장고에 남은 재료를 말해 주세요. 영상의 말과 화면을 함께 읽어 재료와 순서가 정리된 레시피 한 장을 만듭니다.",
    points: [
      "유튜브 영상 → 단계별 레시피",
      "남은 재료만으로 만들 수 있는 요리 제안",
      "컵, 큰술을 g(그램)으로, 2인분을 4인분으로 자동 환산",
    ],
  },
  {
    id: "library",
    side: "left",
    art: "shelf",
    title: "내가 만든 요리를 모아보세요",
    lead: "완성한 요리는 표지와 함께 서재에 꽂힙니다. 나만의 서재에서 잊어버렸던 레시피도 다시 꺼내 볼 수 있습니다.",
    points: [
      "요리마다 자동으로 만들어지는 표지",
      "레시피를 파일로 다운로드",
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
      "목록에서 바로 온라인 쇼핑몰 검색으로 연결",
    ],
  },
];

/* 그림 안에 들어가는 자잘한 값들 */

/** 요리 그림에 들어가는 값. 실제 /cook 의 "지금 할 일" 카드 한 장을 그대로 옮긴 것이다.
    at 은 네 걸음 중 몇 번째에 서 있는지(0 부터)라 진행 막대가 여기까지 차오른다 */
export const cookNow = {
  at: 1,
  tag: "2단계",
  count: "02 / 04",
  text: "중불에서 양파를 3분 볶아 주세요",
  minutes: 3,
} as const;

/** 서재 그림에 세워 놓는 표지. 실제 /shelf 화면의 표지와 같은 것들을 담는다.
    tone 은 표지 색조 이름이고 band 는 표지 아래 띠에 적히는 그 색조의 이름이다 */
export const shelfBooks = [
  { title: "토마토 파스타", tone: "ember", band: "잉걸불", serv: "2인분 · 4단계" },
  { title: "된장찌개", tone: "herb", band: "허브", serv: "2인분 · 5단계" },
  { title: "계란말이", tone: "cream", band: "크림", serv: "1인분 · 3단계" },
  { title: "김치볶음밥", tone: "cocoa", band: "카카오", serv: "2인분 · 4단계" },
  { title: "가지덮밥", tone: "ember", band: "잉걸불", serv: "2인분 · 5단계" },
] as const;

/** 장보기 그림에 나오는 재료. 실제 /shop 의 재료 목록과 같은 꼴이다.
    pick 이 true 인 것만 장바구니에 담긴 것으로 센다 — 집에 있는 것은 체크가 빠져 있다 */
export const cartItems = [
  { nm: "스파게티면", amt: "200g", pick: true },
  { nm: "방울토마토", amt: "10개", pick: true },
  { nm: "마늘", amt: "3쪽", pick: false },
  { nm: "올리브유", amt: "2큰술", pick: false },
  { nm: "바질", amt: "약간", pick: true },
] as const;

/* ---------- 요금제 ---------- */

/** 요금제 한 장에 들어가는 것들 */
export type Plan = {
  /** 요금제 이름 */
  name: string;
  /** 얼마인지. 가장 크게 보이는 자리다 */
  price: string;
  /** 값 뒤에 작게 붙는 "/ 월" 같은 말 */
  per: string;
  /** 이 요금제로 할 수 있는 일들 */
  perks: string[];
  /** 단추에 적어 둘 말 */
  cta: string;
  /** 단추를 누르면 갈 곳. 아직 화면을 안 만든 요금제는 비워 둔다 */
  href?: string;
  /** 가장 권하는 요금제라는 표시. 딱지가 붙고 단추도 꽉 찬 모양이 된다 */
  recommended?: boolean;
};

export const plans: Plan[] = [
  {
    name: "맛보기",
    price: "₩0",
    per: "/ 월",
    perks: ["하루 음성 대화 15분", "레시피 저장 10개", "타이머·계량 환산"],
    cta: "무료로 시작하기",
    href: "/login",
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

/** 자주 묻는 질문. 돈이나 개인정보처럼 망설이게 하는 것부터 앞에 놓는다 */
export const faqs = [
  {
    q: "정말 손을 대지 않고 사용할 수 있나요?",
    a: "네, 처음 한 번만 “시작”을 누르면 이후 모든 과정은 음성 대화로 진행됩니다. 다음 단계 이동, 분량 조절, 타이머 설정까지 모두 말 한마디로 제어할 수 있습니다.",
  },
  {
    q: "앱을 별도로 설치해야 하나요?",
    a: "아니요, 별도의 앱 설치 없이 웹 브라우저만 있으면 됩니다. 스마트폰, 태블릿, PC 등 어떤 기기든 동일한 주소로 접속하면 기존 내역을 그대로 이어 사용할 수 있습니다.",
  },
  // {
  //   q: "제 목소리가 저장되나요?",
  //   a: "저장하지 않습니다. 음성은 대답을 만드는 데만 쓰이고 곧바로 버려집니다. 서재에 남는 것은 레시피 글과 표지 그림뿐입니다.",
  // },
  {
    q: "API 키를 따로 발급받아야 하나요?",
    a: "요금제를 이용 중이시라면 별도 발급이 필요 없습니다. 직접 발급받은 API 키를 등록해 사용하실 수도 있으며, 이 경우 대화 제한 없이 이용 가능합니다. 입력하신 키는 브라우저에만 저장되며, 브라우저가 Gemini API 를 직접 호출하므로 쿡파일럿 서버에는 전달되지 않습니다. 다만 AI 요리 상담 기능만은 서버를 거쳐 처리됩니다.",
  },
  {
    q: "유튜브 링크가 어떻게 레시피로 변환되나요?",
    a: "영상의 음성과 화면을 종합적으로 분석하여 재료와 조리 순서를 자동으로 추출합니다. 분량(계량) 정보가 빠진 영상의 경우 일반적인 기준에 맞춰 보완한 뒤 해당 부분을 별도로 표시해 드립니다.",
  },
  {
    q: "언제든 해지할 수 있나요?",
    a: "네, 별도의 약정이나 위약금 없이 언제든 해지하실 수 있습니다. 해지 후에도 무료 한도 내에서 저장한 레시피를 계속 확인하거나 파일로 다운로드할 수 있습니다.",
  },
] as const;

/** 맨 아랫부분 링크. 갈 화면을 아직 안 만들어서 주소는 전부 자리만 잡아 둔 상태다 */
export const footerLinks = [
  { href: "#", label: "이용약관" },
  { href: "#", label: "개인정보처리방침" },
  { href: "#", label: "문의하기" },
  { href: "#", label: "만든 사람들" },
] as const;

/* ---------- 로그인 · 회원가입 페이지 (/login, /signup) ---------- */

/** 로그인 카드에 들어가는 글. 시안(design/login.png)에 적힌 문구 그대로다 */
export const loginCopy = {
  // 카드 맨 위 제목
  title: "쿡파일럿 로그인",
  // 제목 아래 한 줄. 다시 찾아온 사람에게 건네는 말이다
  lead: "다시 주방의 지휘봉을 잡아보세요.",
  // 이메일 칸에 흐리게 비치는 예시
  emailPlaceholder: "이메일 주소",
  // 비밀번호 칸에 흐리게 비치는 예시
  passwordPlaceholder: "비밀번호",
  // 비밀번호 칸 아래 오른쪽에 붙는 작은 링크
  forgot: "비밀번호를 잊으셨나요?",
  // 보내기 단추
  submit: "로그인하기",
  // 카드 밖 아래에 놓이는 줄
  noAccount: "계정이 없으신가요?",
  // 그 줄 끝의 링크
  signUp: "회원가입",
} as const;

/** 회원가입 카드에 들어가는 글. 로그인 카드와 같은 자리에 같은 모양으로 놓인다 */
export const signupCopy = {
  // 카드 맨 위 제목
  title: "쿡파일럿 회원가입",
  // 제목 아래 한 줄. 처음 온 사람에게 건네는 말이다
  lead: "앞치마만 챙기세요. 나머지는 저희가 합니다.",
  // 닉네임 칸에 흐리게 비치는 예시. 글자 수는 도메인이 정한 값을 그대로 끌어다 쓴다
  namePlaceholder: `닉네임 (${MIN_DISPLAY_NAME}~${MAX_DISPLAY_NAME}글자)`,
  // 이메일 칸에 흐리게 비치는 예시
  emailPlaceholder: "이메일 주소",
  // 비밀번호 칸에 흐리게 비치는 예시. 몇 글자부터인지 여기서 미리 알려 준다
  passwordPlaceholder: `비밀번호 (${MIN_PASSWORD_LENGTH}글자 이상)`,
  // 한 번 더 적는 칸
  confirmPlaceholder: "비밀번호 다시 입력",
  // 보내기 단추
  submit: "가입하고 시작하기",
  // 카드 밖 아래에 놓이는 줄
  haveAccount: "이미 계정이 있으신가요?",
  // 그 줄 끝의 링크
  signIn: "로그인",
  // 가입은 됐는데 메일함을 봐야 할 때 카드에 뜨는 안내
  checkMail:
    "가입이 접수되었습니다. 메일함에 보낸 링크를 눌러 주시면 바로 시작하실 수 있습니다.",
} as const;

/** 로그인·가입이 안 됐을 때 입력칸 밑에 나오는 말.
    검사하는 쪽은 까닭만 알려 주고, 무슨 말로 보여 줄지는 화면이 정한다 */
export const credentialMessages = {
  // 닉네임 칸이 비었을 때
  "name-empty": "닉네임을 입력해 주세요. 글 목록에 이 이름으로 나옵니다.",
  // 한 글자만 적었을 때. 몇 글자부터인지는 도메인이 정한 값을 끌어다 쓴다
  "name-short": `닉네임은 ${MIN_DISPLAY_NAME}글자 이상이어야 합니다.`,
  // 너무 길 때. 잘라서 받지 않고 돌려보내는 까닭은 도메인에 적어 두었다
  "name-long": `닉네임은 ${MAX_DISPLAY_NAME}글자까지 쓸 수 있습니다.`,
  // 이메일 칸이 비었을 때
  "email-empty": "이메일 주소를 입력해 주세요.",
  // 골뱅이가 없거나 앞뒤가 비었을 때
  "email-shape": "이메일 주소 모양이 아닙니다. 골뱅이(@)가 들어갔는지 보아 주세요.",
  // 비밀번호 칸이 비었을 때
  "password-empty": "비밀번호를 입력해 주세요.",
  // 가입할 때만 나온다. 몇 글자인지는 도메인이 정한 값을 그대로 끌어다 쓴다 —
  // 여기에 숫자를 직접 적으면 규칙만 고쳤을 때 문구가 거짓말이 된다
  "password-short": `비밀번호는 ${MIN_PASSWORD_LENGTH}글자 이상이어야 합니다.`,
  // 두 칸이 다를 때
  "password-mismatch": "두 비밀번호가 서로 다릅니다.",
  // 서버가 "회원이 아니다" 라고 했을 때.
  // 둘 중 어느 쪽이 틀렸는지 알려 주지 않는다 — 남의 계정이 있는지 없는지 떠보는 데 쓰이기 때문이다
  rejected: "이메일 또는 비밀번호가 맞지 않습니다.",
  // 가입은 했는데 메일함의 링크를 아직 안 눌렀을 때
  unconfirmed:
    "메일함에 보낸 링크를 아직 안 누르셨습니다. 확인 후 다시 로그인해 주세요.",
  // 이미 그 주소로 만들어진 계정이 있을 때
  taken: "이미 가입된 이메일입니다. 로그인해 주세요.",
  // 수파베이스 쪽 기준에도 못 미치는 비밀번호일 때
  weak: "비밀번호가 너무 단순합니다. 조금 더 길게 지어 주세요.",
  // 짧은 시간에 너무 여러 번 눌렀을 때
  "too-many": "시도가 너무 잦습니다. 잠시 뒤에 다시 해 보세요.",
  // 서버에 다녀오지 못했을 때
  unreachable: "지금 연결이 되지 않습니다. 잠시 뒤에 다시 해 보세요.",
  // 게이트웨이가 아예 준비되지 않았을 때. 환경 변수가 빠지면 여기로 온다
  unavailable:
    "지금은 로그인을 처리할 수 없습니다. 로그인 없이 바로 시작하실 수 있습니다.",
} as const;

/** 로그인 화면 맨 아래 링크. 갈 화면을 아직 안 만들어서 주소는 자리만 잡아 둔 상태다 */
export const loginFooterLinks = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Help Center" },
] as const;

/** 로그인 화면 맨 아래 저작권 줄에 붙는 말. 시안에 적힌 문구다 */
export const loginFootNote = "Atmospheric Precision in the Kitchen.";

/* ---------- 시작 페이지 (/start) ---------- */

/** 위쪽에 놓이는 네 걸음 중 하나. 지금 어느 걸음인지는 StepTrack 이 정해 준다 */
export type StartStep = {
  /** 몇 번째 걸음인지 */
  n: string;
  /** 걸음 이름 */
  title: string;
  /** 그 걸음에서 실제로 뭘 하는지 */
  sub: string;
};

export const startSteps: StartStep[] = [
  { n: "1", title: "준비", sub: "API 키 넣기" },
  { n: "2", title: "고르기", sub: "요리 정하기" },
  { n: "3", title: "장보기", sub: "재료 담기" },
  { n: "4", title: "요리", sub: "음성 안내" },
];

/** "자세한 사용법" 을 펼치면 나오는 안내 */
export const startHowTo = [
  {
    q: "왜 API 키가 필요한가요?",
    a: "목소리를 알아듣고 레시피를 만드는 일을 구글 Gemini 가 합니다. 각자 자기 키를 쓰는 방식이라 다른 사람의 사용량과 섞이지 않고, 기다릴 일도 없습니다.",
  },
  {
    q: "키는 어디에 저장되나요?",
    a: "이 브라우저 안에만 남습니다. 요리 화면은 구글에 요청을 보내는 일까지 브라우저가 직접 합니다. 다만 커뮤니티에 물어보는 화면은 답을 만드는 동안에만 키를 저희 서버로 보냅니다 — 그 요청 안에서만 쓰고 저장하지 않습니다. 다른 기계에서 쓰시려면 그쪽에서 한 번 더 넣으면 됩니다.",
  },
  {
    q: "돈이 드나요?",
    a: "구글이 주는 무료 한도 안에서는 들지 않습니다. 한도를 넘기면 구글 계정으로 과금되므로, 사용량은 Google AI Studio 에서 보실 수 있습니다.",
  },
  {
    q: "키를 받는 데 얼마나 걸리나요?",
    a: "구글 계정만 있으면 1분 안에 됩니다. 아래 단추로 Google AI Studio 에 들어가 'Create API key' 를 누르고, 만들어진 값을 그대로 붙여넣으세요.",
  },
] as const;

/** 키를 돌려보냈을 때 입력칸 밑에 나오는 말.
    검사하는 쪽은 까닭만 알려 주고, 무슨 말로 보여 줄지는 화면이 정한다 */
export const apiKeyMessages = {
  empty: "키를 붙여넣어 주세요.",
  prefix: "구글 Gemini 키는 AIza 로 시작합니다. 다른 서비스의 키를 가져오신 것 같습니다.",
  length: "길이가 맞지 않습니다. 복사하다 앞뒤가 잘렸는지 보아 주세요.",
  shape: "키에 쓸 수 없는 글자가 섞여 있습니다. 공백이나 따옴표가 따라왔을 수 있습니다.",
  storage: "브라우저가 저장을 막고 있습니다. 시크릿 창이라면 일반 창에서 다시 해 보세요.",
} as const;

/** 입력칸에 흐리게 비치는 예시. 진짜 키가 아니라 어떻게 생겼는지만 보여 주는 값이다 */
export const apiKeyPlaceholder = "AIza… 로 시작하는 키를 붙여넣으세요";

/** 구글이 키를 나눠 주는 곳 */
export const aiStudioUrl = "https://aistudio.google.com/app/apikey";

/* ---------- 커뮤니티 페이지 (/community) ---------- */

/** 커뮤니티 첫 화면에 놓이는 글. 시안(design/blogmain.png)의 자리 그대로다 */
export const communityCopy = {
  /* 가운데 큰 제목. 여기가 서비스의 홈이라 이름이 그대로 걸린다.
     글자를 또 적지 않고 위에서 정한 값을 끌어다 쓴다 — 이름이 바뀌는 날
     두 군데를 고치면 한쪽이 옛 이름으로 남는다 */
  title: site.name,
  // 제목 아래 한 줄. 여기가 이 화면의 성격을 정한다
  lead: "쿡파일럿과 만들어낸 우리의 맛있는 순간들",
  // 검색칸에 흐리게 비치는 예시
  searchPlaceholder: "재료, 요리 이름, 셰프를 찾아보세요",
  // 왼쪽 목록 맨 위에 붙는 작은 머리글
  tabsLabel: "둘러보기",
  // 셰프 랭킹 위에 붙는 머리글
  rankLabel: "이번 주 인기 셰프",
  // 태그 목록 위에 붙는 머리글
  tagLabel: "자주 찾는 태그",
  // 지금 몇 사람이 요리 중인지. 시안의 "1,204 Pilots Active" 자리다
  liveCount: "지금 1,204명이 요리 중",
} as const;

/** 왼쪽 탭에 사람이 읽을 이름을 붙인다.
    속이름은 lib/domain/community-tab.ts 가 정하고, 여기서는 부르는 말만 정한다 */
export const communityTabLabels = {
  popular: "인기",
  recent: "최신",
  brand: "브랜드 레시피",
  trend: "SNS 유행",
} as const satisfies Record<CommunityTab, string>;

/** 커뮤니티에 올라온 글 하나 */
export type CommunityPost = {
  /** 주소에 쓸 이름. 겹치면 안 된다 */
  id: string;
  /** 어느 탭에 걸리는지. 한 글이 여러 탭에 걸릴 수 있다 */
  tabs: readonly CommunityTab[];
  /** 그림 왼쪽 위에 붙는 분류 딱지 */
  badge: string;
  /** 딱지 옆에 붙는 시간. 없으면 안 그린다 */
  minutes?: number;
  /** 글 제목 */
  title: string;
  /** 카드에 두세 줄 보이는 요약. 큰 카드에만 쓴다 */
  summary?: string;
  /** 올린 사람 */
  chef: string;
  /** 좋아요 수. "3.2k" 처럼 이미 줄여 적은 글자다 */
  hearts: string;
  /**
   * 붙일 그림 주소.
   *
   * 예시 글은 이 칸이 비어 있고, 카드가 id 로 파일을 찾아 쓴다.
   * 사람이 쓴 글은 스토리지에 올린 주소가 들어온다 — 파일 이름 규칙을
   * 따르지 않으므로 여기 적어 두어야 한다.
   */
  photo?: string;
  /**
   * 접시 그림의 색조.
   * 사진을 쓰지 않고 CSS 로 그린 접시를 놓는다 — 시안의 사진은 우리 것이 아니고,
   * 바깥 주소에서 그림을 끌어오면 next/image 설정을 건드려야 하기 때문이다.
   */
  tone: "ember" | "herb" | "cocoa" | "cream";
};

/**
 * 지금 올라와 있는 글들.
 *
 * 나중에 수파베이스에서 가져오게 되면 이 배열만 없어지고 화면은 그대로다.
 * 그래서 화면이 이 배열을 직접 뒤지지 않고 아래 postsByTab() 을 거치게 해 두었다.
 */
export const communityPosts: readonly CommunityPost[] = [
  /* ---------- 인기 ---------- */
  {
    id: "ribeye",
    tabs: ["popular"],
    badge: "메인",
    minutes: 45,
    title: "숯불 향 입힌 등심 스테이크",
    summary:
      "겉은 바싹, 속은 붉게. 팬을 달구는 시간과 뒤집는 횟수만 지키면 집에서도 같은 자리가 나옵니다. 마지막에 얹는 버터는 불을 끄고 나서.",
    chef: "불꽃요리사",
    hearts: "3.2k",
    tone: "ember",
  },
  {
    id: "carbonara",
    tabs: ["popular"],
    badge: "파스타",
    minutes: 20,
    title: "계란 안 익히는 까르보나라",
    chef: "십오분한끼",
    hearts: "2.1k",
    tone: "cream",
  },
  {
    id: "cacao",
    tabs: ["popular"],
    badge: "디저트",
    minutes: 90,
    title: "흑임자 카카오 스피어",
    chef: "디저트요정",
    hearts: "1.5k",
    tone: "cocoa",
  },
  {
    id: "gyeran",
    tabs: ["popular"],
    badge: "밑반찬",
    minutes: 12,
    title: "물 한 컵으로 만드는 계란찜",
    chef: "냉털장인",
    hearts: "1.3k",
    tone: "cream",
  },

  /* ---------- 최신 ---------- */
  {
    id: "bibim",
    tabs: ["recent"],
    badge: "한 그릇",
    minutes: 15,
    title: "남은 나물로 만드는 비빔국수",
    summary:
      "냉장고에 애매하게 남은 나물을 그대로 씁니다. 양념장 비율만 외워 두면 재료가 바뀌어도 맛이 흔들리지 않습니다.",
    chef: "냉털장인",
    hearts: "641",
    tone: "herb",
  },
  {
    id: "curry",
    tabs: ["recent"],
    badge: "한 그릇",
    minutes: 35,
    title: "토마토 두 알로 끓인 카레",
    chef: "자취9년차",
    hearts: "418",
    tone: "ember",
  },
  {
    id: "focaccia",
    tabs: ["recent"],
    badge: "베이킹",
    minutes: 180,
    title: "반죽 안 치는 포카치아",
    chef: "오븐없이굽기",
    hearts: "372",
    tone: "cream",
  },
  {
    id: "tofu",
    tabs: ["recent"],
    badge: "간식",
    minutes: 18,
    title: "에어프라이어 두부강정",
    chef: "기름없이바삭",
    hearts: "255",
    tone: "herb",
  },

  /* ---------- 브랜드 레시피 ----------
     여기 이름은 **지어낸 브랜드**다. 진짜 회사 이름을 붙이면, 그 회사가 쓰지도 않은
     글을 쓴 것처럼 되어 버린다. 제휴가 붙으면 그때 진짜 이름으로 바꾼다 */
  {
    id: "brand-gochujang",
    tabs: ["brand"],
    badge: "브랜드",
    minutes: 20,
    title: "태양초 고추장으로 비비는 나물 비빔밥",
    summary:
      "양념장 비율만 외우면 나물이 무엇이든 맛이 안 흔들립니다. 고추장 2, 참기름 1, 설탕 반. 밥은 고슬하게 지어 한 김 식혀 비빕니다.",
    chef: "한들식품",
    hearts: "2.7k",
    tone: "ember",
  },
  {
    id: "brand-oil",
    tabs: ["brand"],
    badge: "브랜드",
    minutes: 10,
    title: "들기름 한 큰술로 끝내는 막국수",
    chef: "고운밥상",
    hearts: "1.9k",
    tone: "herb",
  },
  {
    id: "brand-garlic",
    tabs: ["brand"],
    badge: "브랜드",
    minutes: 25,
    title: "다진마늘 한 통으로 굽는 마늘빵",
    chef: "청수식품",
    hearts: "1.4k",
    tone: "cream",
  },
  {
    id: "brand-sugar",
    tabs: ["brand"],
    badge: "브랜드",
    minutes: 60,
    title: "하얀설탕으로 굽는 홈메이드 약과",
    chef: "달소금",
    hearts: "980",
    tone: "cocoa",
  },

  /* ---------- SNS 유행 ---------- */
  {
    id: "malatanghulu",
    tabs: ["trend", "popular"],
    badge: "야식",
    minutes: 30,
    title: "마라탕후루 한 상 차리기",
    summary:
      "매운 것 먹고 단 것 먹는 그 순서를 한 번에. 마라 국물은 기름에 향을 먼저 열고, 탕후루 시럽은 젓지 않는 것이 요령입니다.",
    chef: "마라중독자",
    hearts: "4.1k",
    tone: "ember",
  },
  {
    id: "dubai",
    tabs: ["trend"],
    badge: "디저트",
    minutes: 40,
    title: "두바이 초콜릿 딸기컵",
    chef: "디저트요정",
    hearts: "3.6k",
    tone: "cocoa",
  },
  {
    id: "rose",
    tabs: ["trend"],
    badge: "야식",
    minutes: 25,
    title: "우유로 만드는 로제 떡볶이",
    chef: "야식대장",
    hearts: "2.4k",
    tone: "ember",
  },
  {
    id: "croffle",
    tabs: ["trend"],
    badge: "간식",
    minutes: 15,
    title: "냉동 생지로 굽는 크로플",
    chef: "오븐없이굽기",
    hearts: "1.7k",
    tone: "cream",
  },
];

/**
 * 탭 하나에 걸리는 글만 골라 준다.
 *
 * 화면이 `posts.filter(...)` 를 직접 쓰지 않게 하려고 둔다.
 * 나중에 이 자리가 데이터베이스 조회로 바뀔 때 고칠 곳이 한 군데면 된다.
 */
// [F1][함수] postsByTab(tab): 그 탭에 걸린 예시 글만 고른다
// 입력: tab → 처리: communityPosts 를 훑어 tabs 에 tab 이 든 것만 → 출력: CommunityPost[]
// [F1][반환] 목록 → app/community/page.tsx 가 카드로 그린다
export function postsByTab(tab: CommunityTab): readonly CommunityPost[] {
  return communityPosts.filter((p) => p.tabs.includes(tab));
}

/**
 * 검색어로 글을 고른다. 탭은 보지 않는다.
 *
 * 검색할 때 탭을 함께 걸면 "인기" 탭에서 찾은 사람은 최신 글을 못 본다.
 * 사람이 검색칸에 무언가를 쳤다는 것은 **갈래와 상관없이 찾겠다**는 뜻이다.
 *
 * 어느 칸을 뒤지는지가 이 함수의 값어치다. 제목만 뒤지면 "브랜드" 나
 * 셰프 이름으로는 못 찾는다.
 */
// [F2][함수] postsByQuery(query): 검색어로 예시 글을 고른다(탭은 안 본다)
// 입력: query → 처리: [반복] 글마다 matchesQuery(domain/community-tab:F8) → 출력: CommunityPost[]
// 제목·글쓴이·카테고리·설명을 함께 뒤진다 — 태그 링크도 이 길로 들어온다
export function postsByQuery(query: string): readonly CommunityPost[] {
  return communityPosts.filter((p) =>
    matchesQuery([p.title, p.chef, p.badge, p.summary ?? ""], query),
  );
}

/**
 * id 로 카드 하나를 찾는다. 없으면 null.
 *
 * 글 하나만 보는 화면이 이 함수로 들어온다. 화면이 배열을 직접 뒤지지 않게
 * 두는 까닭은 postsByTab() 과 같다 — 나중에 이 자리가 데이터베이스 조회로
 * 바뀔 때 고칠 곳이 한 군데면 된다.
 */
// [F3][함수] findPost(id): 예시 글 카드 하나를 id 로 찾는다
// 입력: id → 처리: communityPosts 훑기 → 출력: CommunityPost 또는 null
export function findPost(id: string): CommunityPost | null {
  return communityPosts.find((p) => p.id === id) ?? null;
}

/** 이번 주 인기 셰프 한 사람 */
export type RankedChef = {
  /** 이름 */
  name: string;
  /** 이 사람을 한마디로 설명하는 말 */
  note: string;
  /** 이번 주에 받은 좋아요 */
  hearts: string;
};

/** 이번 주 인기 셰프. 순위는 배열 차례가 곧 등수라 따로 적지 않는다 —
    숫자를 같이 적어 두면 순서만 바꿨을 때 등수가 어긋난다 */
export const rankedChefs: readonly RankedChef[] = [
  { name: "불꽃요리사", note: "불 다루는 법", hearts: "12.4k" },
  { name: "디저트요정", note: "디저트만 3년", hearts: "9.8k" },
  { name: "십오분한끼", note: "15분 안에 한 끼", hearts: "8.1k" },
  { name: "냉털장인", note: "냉장고 털이 전문", hearts: "6.5k" },
  { name: "오븐없이굽기", note: "오븐 없이 굽기", hearts: "5.2k" },
];

/** 자주 찾는 태그. 앞의 것이 더 많이 눌린 것이다 */
export const popularTags: readonly { label: string; count: string }[] = [
  { label: "자취요리", count: "2.1k" },
  { label: "에어프라이어", count: "1.7k" },
  { label: "10분완성", count: "1.4k" },
  { label: "다이어트", count: "1.2k" },
  { label: "아이반찬", count: "980" },
  { label: "혼술안주", count: "874" },
  { label: "비건", count: "612" },
  { label: "밀프렙", count: "455" },
];

/** 커뮤니티 화면 맨 아래 링크. 로그인 화면과 같은 자리표시자다 */
export const communityFooterLinks = [
  { href: "#", label: "개인정보처리방침" },
  { href: "#", label: "이용약관" },
  { href: "#", label: "문의하기" },
] as const;

/* ---------- 목소리·속도 고르기 (/start/model) ---------- */

/** 이 화면에 적히는 말. 도메인은 속이름만 알고, 부를 말은 여기서 정한다 */
export const setupCopy = {
  // 화면에서 가장 큰 물음. 할 일이 하나뿐인 화면이라 물음도 하나만 던진다
  title: "어떤 목소리로 안내할까요?",
  // 왜 지금 이걸 고르는지 한 줄로 알려 준다
  lead: "요리하는 내내 이 목소리가 함께합니다. 눌러서 미리 들어 보세요.",
  // 성별 고르는 자리의 작은 제목
  genderLabel: "목소리",
  // 미리 듣기 단추
  listen: "미리 듣기",
  // 미리 듣는 중
  listening: "들려 드리는 중…",
  // 다음 화면으로 넘어가는 단추
  go: "이 목소리로 시작",
  // 속도 고르는 자리의 작은 제목
  speedLabel: "답변 속도",
  // 아직 못 만든 표지 이야기. 미리 알려 둬야 나중에 속았다는 느낌이 안 든다
  badge: "체험 중에는 AI 표지 대신 기본 표지가 만들어집니다",
  // 맨 아랫줄 — 다음에 무슨 일이 생기는지 미리 알려 준다
  foot: "마이크 권한은 시작을 누를 때 물어봅니다",
  // 그 옆에 붙는, 나중에 바꿀 수 있다는 안내
  footHot: "답변 속도는 언제든 왼쪽 메뉴에서",
} as const;

/** 말투 카드 한 장에 들어가는 것들 */
export type VoiceToneCard = {
  /** 도메인이 정한 속이름 */
  id: VoiceTone;
  /** 카드에 크게 적히는 이름 */
  name: string;
  /** 이름 밑에 붙는 한마디 */
  sub: string;
  /** 이 말투면 어떻게 들리는지 보여 주는 예문 */
  line: string;
};

/** 세 가지 말투. 차례는 도메인의 voiceTones 와 맞춰 둔다 */
export const voiceToneCards: readonly VoiceToneCard[] = [
  {
    id: "calm",
    name: "차분한",
    sub: "또박또박",
    line: "중불로 줄이고 3분만 더 볶아 주세요.",
  },
  {
    id: "bright",
    name: "밝은",
    sub: "활기차게",
    line: "좋아요, 이제 거의 다 됐어요!",
  },
  {
    id: "soft",
    name: "부드러운",
    sub: "여유 있게",
    line: "천천히 하셔도 됩니다. 아직 시간 있어요.",
  },
];

/** 성별을 부르는 말. 속이름은 도메인이 정하고 여기서는 이름만 붙인다 */
export const voiceGenderLabels = {
  female: "여성",
  male: "남성",
} as const satisfies Record<VoiceGender, string>;

/** 답변 속도 한 칸에 들어가는 것들 */
export type AnswerSpeedCard = {
  /** 도메인이 정한 속이름 */
  id: AnswerSpeed;
  /** 단추에 적히는 이름 */
  name: string;
  /** 왼쪽 메뉴에서 이름 옆에 붙는 모델 별명. 긴 모델 이름을 그대로 쓰면 칸을 넘긴다 */
  badge: string;
  /** 골랐을 때 밑에 나오는 설명 */
  note: string;
};

/** 두 가지 속도. 차례는 도메인의 answerSpeeds 와 맞춰 둔다 */
export const answerSpeedCards: readonly AnswerSpeedCard[] = [
  {
    id: "quick",
    name: "빠르게",
    badge: "Flash-Lite",
    note: "불 앞에서 묻고 바로 답을 듣기 좋습니다. 유튜브 영상에서 분량을 옮겨 올 때는 조금 덜 꼼꼼합니다.",
  },
  {
    id: "careful",
    name: "꼼꼼하게",
    badge: "Flash",
    note: "분량과 순서를 빠뜨리지 않고 옮겨 옵니다. 답이 나오기까지 몇 초 더 걸립니다.",
  },
];

/* ---------- 요리 정하기 (/pick) ---------- */

/** 음성 화면에 적히는 말 */
export const pickCopy = {
  // 제목 위에 붙는 작은 머리말
  eyebrow: "말로 주문하기",
  // 화면에서 가장 큰 물음
  title: "무엇을 만들까요?",
  // 무엇을 어떻게 하면 되는지 한 줄로
  lead: "아래 단추를 누르고 “제육볶음 만들래” 처럼 말씀하세요",
  // 마이크가 켜져 있는 동안 바뀌는 안내
  listening: "듣고 있습니다. 다 말씀하시면 한 번 더 누르세요",
  // 인분 고르는 자리의 이름
  servingsLabel: "몇 인분으로 만들까요",
  // 아래 카드 묶음의 제목
  // 광고 자리 단추에 적히는 말. "준비 중" 과 뜻이 다르다 —
  // 준비 중은 우리가 못 만든 것이고, 이쪽은 살 사람을 기다리는 자리다
  adWanted: "광고 모집중",
  // 펼친 칸을 접는 단추
  close: "닫기",
  // 다녀오는 중
  working: "가져오는 중…",
  // 유튜브 칸
  youtubeLabel: "요리 영상 주소",
  youtubePlaceholder: "https://www.youtube.com/watch?v=…",
  youtubeNote:
    "제미나이가 영상을 직접 보고 옮겨 적습니다. 영상 길이에 따라 20초쯤 걸릴 수 있습니다. 원작자 채널은 레시피 출처에 남습니다.",
  bring: "가져오기",
  // 냉장고 칸
  fridgeLabel: "지금 있는 재료",
  fridgePlaceholder: "두부, 계란, 김치, 대파",
  fridgeNote:
    "있는 것만 적으면 됩니다. 기본 양념은 안 적어도 알아서 뺍니다",
  find: "만들 수 있는 요리 찾기",
  // 후보를 늘어놓은 자리의 제목. 뒤에 몇 개인지 붙는다
  ideasLabel: "이 재료로 이런 걸 만들 수 있습니다",
  // 후보 카드의 단추
  ideaMake: "이 요리 만들기",
  // 사야 하는 것이 있을 때 앞에 붙는 말
  ideaMissing: "사야 할 것",
  // 사야 할 것이 없을 때
  ideaHaveAll: "가진 재료만으로 됩니다",
  // 다른 재료로 다시 찾는 단추
  ideaAgain: "재료 고쳐서 다시 찾기",
  // 후보를 고르고 레시피를 만드는 동안
  ideaWorking: "레시피 만드는 중…",
  // 브랜드 칸
  brandLabel: "이런 모습으로 붙습니다",
  brandStart: "이 레시피로 시작",
  brandNote:
    "아직 붙은 광고가 없습니다. 위 셋은 어떤 모습이 되는지 보여 주는 예시라 눌리지 않습니다.",
  // 키가 없을 때
  needKey: "먼저 시작 화면에서 제미나이 API 키를 넣어 주세요.",
  otherWays: "또는 이렇게 시작해도 됩니다",
} as const;

/** 마이크를 못 켰을 때 띄우는 말. 까닭은 화면이 알아내고 문장은 여기서 고른다 */
export const micMessages = {
  denied: "마이크 사용을 막아 두셨습니다. 주소창 왼쪽 자물쇠에서 허용으로 바꿔 주세요.",
  missing: "이 브라우저에서는 마이크를 찾지 못했습니다. 다른 브라우저에서 열어 보세요.",
  failed: "마이크를 켜지 못했습니다. 다른 앱이 쓰고 있는지 보아 주세요.",
} as const;

/** 말 대신 다른 길로 시작하는 카드 한 장 */
export type PickCard = {
  /** 어느 칸을 펼칠지 정할 때 쓰는 이름. 주소에 실리지 않아 영어로 둔다 */
  id: "youtube" | "fridge" | "brand";
  /** 카드 앞의 그림 이름 */
  icon: IconName;
  /** 카드 제목 */
  title: string;
  /** 무엇을 해 주는 카드인지 */
  desc: string;
  /** 카드 아래 단추에 적히는 말 */
  action: string;
  /** 이 카드가 글자 모델을 쓰는지. 쓰는 카드에만 지금 고른 속도를 같이 보여 준다 */
  usesModel: boolean;
  /** 광고 자리인지. 광고에는 표시를 붙여야 한다 */
  ad?: boolean;
};

/** 세 갈래 시작. 맨 오른쪽은 나중에 광고로 채울 자리다 */
export const pickCards: readonly PickCard[] = [
  {
    id: "youtube",
    icon: "play",
    title: "유튜브 레시피 가져오기",
    desc: "요리 영상 주소를 넣으면 재료와 분량, 원작자 채널까지 그대로 옮겨 옵니다",
    action: "영상 주소 넣기",
    usesModel: true,
  },
  {
    id: "fridge",
    icon: "fridge",
    title: "냉장고를 부탁해",
    desc: "지금 있는 재료를 적으면 그걸로 만들 수 있는 요리를 찾아 드립니다",
    action: "재료 적기",
    usesModel: true,
  },
  {
    id: "brand",
    icon: "tag",
    title: "브랜드 레시피",
    desc: "식품 브랜드가 직접 올린 레시피입니다. 재료도 그 브랜드 제품으로 맞춰 드립니다",
    action: "레시피 보기",
    usesModel: false,
    ad: true,
  },
];

/**
 * 브랜드 레시피 자리에 놓이는 예시.
 *
 * **여기 브랜드 이름은 실제로 있는 회사다.** 상품을 가리키는 자리라서
 * 그렇게 두었다 — 장보기 화면의 광고 줄과 같은 기준이다.
 * 다만 이 회사들이 실제로 올린 레시피가 아니므로 **누를 수 없게** 잠가 두고,
 * 화면에도 예시라고 밝힌다. 진짜 제휴가 붙으면 그때 살린다.
 */
export const brandSamples = [
  { brand: "CJ 백설", title: "백설 카놀라유로 만드는 제육볶음" },
  { brand: "오뚜기", title: "오뚜기 참기름 비빔국수" },
  { brand: "해찬들", title: "해찬들 고추장 찌개" },
] as const;

/** 왼쪽 메뉴에 적히는 말 */
export const railCopy = {
  // 도구 묶음의 제목
  tools: "도구",
  // 계량 환산 접이칸의 제목
  measure: "계량 환산",
  // 서재 묶음의 제목
  shelf: "내 요리 서재",
  // 서재를 여는 단추
  shelfOpen: "서재 열기",
  // 백업 접이칸의 제목
  backup: "서재 백업",
  // 백업 파일을 내려받는 단추
  backupSave: "파일로 내려받기",
  // 백업 파일을 도로 넣는 단추
  backupLoad: "파일에서 되돌리기",
  // 이번 방문에 몇 번 물었는지
  asked: "이번 세션 질문",
  // 담아 둔 것을 전부 버리는 단추
  wipe: "전부 지우기",
  // 다른 키로 갈아 끼우러 가는 단추
  rekey: "API 키 바꾸기",
} as const;

/** 계량 단위를 부르는 말. 속이름과 부를 말을 갈라 두는 것은 다른 곳과 같다 */
export const measureUnitLabels = {
  cup: "컵 (200ml)",
  tbsp: "큰술",
  tsp: "작은술",
  ml: "ml",
} as const satisfies Record<MeasureUnit, string>;

/** 백업을 되돌리다 걸렸을 때 띄우는 말 */
export const backupMessages = {
  broken: "백업 파일이 아닌 것 같습니다. 내려받은 그 파일이 맞는지 보아 주세요.",
  shape: "파일 안이 상해 있습니다. 열어서 고치신 적이 있다면 원본으로 다시 해 보세요.",
  version: "더 새로운 판으로 만든 백업입니다. 쿡파일럿을 새로 고친 뒤 다시 해 보세요.",
  storage: "브라우저가 저장을 막고 있습니다. 시크릿 창이라면 일반 창에서 다시 해 보세요.",
} as const;

/** 백업 파일을 내려받을 때 붙는 이름 */
export const backupFileName = "cookpilot-서재.json";
