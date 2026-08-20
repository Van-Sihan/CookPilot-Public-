import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Noto_Serif_KR, Roboto_Mono } from "next/font/google";
import { site } from "@/lib/site-content";
import "./globals.css";

/* 라틴 제목은 Instrument Serif 가, 한글 제목은 Noto Serif KR 이 받는다.
   한글 자소가 붙은 파일은 수가 많아 미리 불러오지 않는다 — 필요한 조각만
   unicode-range 로 내려온다. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  weight: ["500", "600", "700"],
  preload: false,
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.nameKo} ${site.name} — ${site.tagline}`,
    template: `%s · ${site.nameKo}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "AI 요리",
    "음성 레시피",
    "요리 비서",
    "유튜브 레시피",
    "쿡파일럿",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: site.name,
    title: `${site.nameKo} — ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary",
    title: `${site.nameKo} — ${site.tagline}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0A09",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${instrumentSerif.variable} ${notoSerifKr.variable} ${robotoMono.variable}`}
    >
      <head>
        {/* 본문 글꼴 Pretendard 는 구글 글꼴에 없어 CDN 에서 받아 온다 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
