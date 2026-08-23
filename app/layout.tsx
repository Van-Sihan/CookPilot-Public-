import type { Metadata, Viewport } from "next";
import {
  Instrument_Serif,
  Nanum_Gothic_Coding,
  Noto_Serif_KR,
  Roboto_Mono,
} from "next/font/google";
import { site } from "@/lib/site-content";
import "./globals.css";

/* 영어 제목은 Instrument Serif 가, 한글 제목은 Noto Serif KR 이 맡는다.
   한글은 글자가 워낙 많아서 글꼴 파일이 잘게 쪼개져 있다. 그래서 미리 다 받지 않고,
   화면에 실제로 나오는 글자 조각만 그때그때 받아 온다. */
const instrumentSerif = Instrument_Serif({
  // CSS 에서 var(--font-instrument-serif) 라고 부를 수 있게 이름을 지어 둔다
  variable: "--font-instrument-serif",
  // 이 글꼴은 굵기가 한 가지뿐이라 400 만 받는다
  weight: "400",
  // 영어 글자만 쓰는 자리라 영어 부분만 받는다
  subsets: ["latin"],
  // 글꼴이 늦게 와도 글씨는 먼저 보이게 한다. 빈 화면을 오래 보여 주지 않으려는 것이다
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  // 한글 제목용 이름
  variable: "--font-noto-serif-kr",
  // 제목에 쓰는 굵기 세 가지만 받는다. 다 받으면 파일이 너무 무거워진다
  weight: ["500", "600", "700"],
  // 한글은 조각 파일이 수백 개라 미리 받지 않고 쓰이는 것만 오게 둔다
  preload: false,
  // 받는 동안에는 다른 글꼴로라도 글씨가 보이게 한다
  display: "swap",
});

const robotoMono = Roboto_Mono({
  // 타이머나 계량처럼 숫자 자리가 흔들리면 안 되는 곳에 쓴다
  variable: "--font-roboto-mono",
  // 보통 굵기와 조금 굵은 것, 두 가지면 넉넉하다
  weight: ["400", "500"],
  // 숫자와 영어만 쓰니 영어 부분만 받는다
  subsets: ["latin"],
  // 다른 글꼴과 똑같이, 늦게 와도 글씨부터 보이게 한다
  display: "swap",
});

/* Roboto Mono 는 라틴만 받아 와서 한글 글자가 없다. 그 자리를 이 글꼴이 메운다.
   흔한 한글 글꼴을 쓰면 소제목이 본문과 똑같아 보이는데, 이건 한글도 글자마다
   폭이 같은 고정폭이라 라틴 쪽 Roboto Mono 와 결이 이어진다.
   한글은 조각 파일이 수백 개라 Noto Serif KR 과 마찬가지로 미리 받지 않는다. */
const nanumGothicCoding = Nanum_Gothic_Coding({
  // CSS 에서 var(--font-nanum-coding) 이라고 부를 수 있게 이름을 지어 둔다
  variable: "--font-nanum-coding",
  // 이 글꼴에 있는 굵기는 둘뿐이다. 작은 소제목은 굵은 쪽을 쓴다
  weight: ["400", "700"],
  // 쓰이는 글자 조각만 그때그때 받아 온다
  preload: false,
  // 늦게 와도 글씨는 먼저 보이게 한다
  display: "swap",
});

/* 배포 주소를 고르는 차례. 직접 넣은 값이 가장 앞이고, 없으면 버셀이 넣어 주는
   운영 도메인을 쓰고, 그것도 없으면 개발용 주소로 둔다.
   가운데 단계를 둔 까닭 — 처음 배포할 때는 도메인이 정해지기 전이라
   NEXT_PUBLIC_SITE_URL 을 미리 적어 둘 수가 없다. 그 사이에도 링크 미리보기가
   localhost 를 가리키지 않게 하는 장치다 */
/* 환경 변수는 '없음' 과 '빈 값' 이 다르다. 버셀은 .env.example 을 읽어 빈 칸을
   미리 만들어 두는데, 그것을 지우지 않고 배포하면 값이 빈 문자열로 들어온다.
   ?? 는 null·undefined 만 걸러서 빈 문자열이 그대로 통과하고, 그러면
   new URL("") 이 터져 모든 화면이 500 이 된다. 빈 값도 '없음' 으로 본다 */
const pickEnv = (value: string | undefined) => value?.trim() || undefined;

// 버셀이 배포할 때 스스로 넣어 주는 운영 도메인. 규약(https://)이 빠져 있다
const vercelHost = pickEnv(process.env.VERCEL_PROJECT_PRODUCTION_URL);
// 앞에서부터 있는 값을 고른다. 버셀 값에는 규약을 붙여야 URL 로 읽힌다
const siteUrl =
  pickEnv(process.env.NEXT_PUBLIC_SITE_URL) ??
  (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  /* 링크 미리보기 그림의 주소를 절대 주소로 만들 때 쓰는 뿌리.
     글마다 요리 사진이 붙는데, "/food/ribeye.jpg" 만 내보내면 카카오톡이나
     슬랙이 어느 서버의 그림인지 몰라 아무것도 못 띄운다 */
  metadataBase: new URL(siteUrl),
  title: {
    // 홈에서 보이는 제목. 한글 이름과 영어 이름을 같이 둬서 어느 쪽으로 검색해도 걸리게 한다
    default: `${site.nameKo} ${site.name} — ${site.tagline}`,
    // 다른 페이지는 제 이름 뒤에 서비스 이름이 붙는다
    template: `%s · ${site.nameKo}`,
  },
  // 검색 결과에 같이 나오는 소개 한 줄
  description: site.description,
  // 브라우저가 앱 이름으로 쓰는 값
  applicationName: site.name,
  keywords: [
    "AI 요리",
    "음성 레시피",
    "요리 비서",
    "유튜브 레시피",
    "쿡파일럿",
  ],
  openGraph: {
    // 앱이 아니라 웹사이트라고 알려 준다
    type: "website",
    // 한국어 화면이라고 밝혀서 다른 나라 사람에게 잘못 보이지 않게 한다
    locale: "ko_KR",
    // 링크를 붙였을 때 위쪽에 뜨는 서비스 이름
    siteName: site.name,
    // 링크 미리보기 상자의 제목
    title: `${site.nameKo} — ${site.tagline}`,
    // 링크 미리보기 상자의 설명
    description: site.description,
  },
  twitter: {
    // 아직 대표 그림이 없어서 글씨만 나오는 작은 상자를 쓴다
    card: "summary",
    // 상자 제목
    title: `${site.nameKo} — ${site.tagline}`,
    // 상자 설명
    description: site.description,
  },
};

export const viewport: Viewport = {
  // 휴대폰 브라우저 주소창까지 배경과 같은 검정으로 물들인다
  themeColor: "#0B0A09",
  // 어두운 화면으로만 만든 사이트라고 알려 줘서 브라우저가 색을 뒤집지 않게 한다
  colorScheme: "dark",
};

// [F1][함수] RootLayout({children}): 모든 화면을 감싸는 바깥 껍데기
// 입력: children(그 주소의 화면) → 처리: html/body + 글꼴·전역 CSS 를 두름 → 출력: 화면(JSX)
// 여기서 정한 metadata 의 title 틀을 각 화면의 title 이 타고 들어간다
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      // 한국어 문서라고 알려 준다. 그래야 화면을 읽어 주는 기계가 한국어로 읽는다
      lang="ko"
      // 위에서 만든 글꼴 이름 네 개를 문서 전체에 걸어 둔다. 그래야 CSS 어디서든 쓸 수 있다
      className={`${instrumentSerif.variable} ${notoSerifKr.variable} ${robotoMono.variable} ${nanumGothicCoding.variable}`}
    >
      <head>
        {/* 본문 글꼴인 Pretendard 는 구글 글꼴 목록에 없어서 다른 곳에서 받아 온다 */}
        {/* 글꼴을 받기 전에 미리 길부터 터 둔다. 그러면 기다리는 시간이 줄어든다 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          // 몇 번째 판인지 딱 못 박아 둔다. 그래야 저쪽이 바뀌어도 우리 화면이 흔들리지 않는다
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      {/* 페이지마다 다른 내용은 children 이라는 이름으로 들어온다 */}
      <body>{children}</body>
    </html>
  );
}
