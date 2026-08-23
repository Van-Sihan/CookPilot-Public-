import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* 유튜브 미리보기 그림만 바깥에서 받아 온다.
       next/image 는 아무 주소나 안 받아 준다 — 여기 안 적힌 집에서 오는 그림은
       막힌다. 남이 우리 서버로 아무 그림이나 실어 나르지 못하게 하는 장치다 */
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
};

export default nextConfig;
