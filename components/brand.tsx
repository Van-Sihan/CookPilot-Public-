/**
 * 로고와 파형. 둘 다 같은 잉걸불 그라데이션(#B94432 → #E45B32 → #F6C453)을 쓴다.
 * SVG 그라데이션 id 는 문서 전체에서 유일해야 하므로 부르는 쪽에서 넘겨준다.
 */

const STOPS = (
  <>
    <stop offset="0%" stopColor="#B94432" />
    <stop offset="45%" stopColor="#E45B32" />
    <stop offset="100%" stopColor="#F6C453" />
  </>
);

/** 냄비 아래에서 소리가 피어오르는 모양. design/logo.svg 와 같은 좌표. */
const LOGO_BARS: Array<[x: number, y: number, h: number]> = [
  [18.25, 107.4, 6.6],
  [25.42, 106.76, 7.24],
  [32.58, 96.66, 17.34],
  [39.75, 95.24, 18.76],
  [46.92, 88.44, 25.56],
  [54.08, 79.35, 34.65],
  [61.25, 86.77, 27.23],
  [68.42, 85.54, 28.46],
  [75.58, 83.09, 30.91],
  [82.75, 94.91, 19.09],
  [89.92, 99.85, 14.15],
  [97.08, 105.3, 8.7],
  [104.25, 107.4, 6.6],
];

export function Logo({ size = 30, id }: { size?: number; id: string }) {
  const grad = `logo-grad-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={grad}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="114"
          x2="0"
          y2="76"
        >
          {STOPS}
        </linearGradient>
      </defs>
      {/* 냄비 몸통과 뚜껑, 양쪽 손잡이 */}
      <path
        d="M30 34h68v14a24 24 0 0 1-24 24H54a24 24 0 0 1-24-24z"
        fill="#B94432"
      />
      <rect x="24" y="25" width="80" height="9" rx="4.5" fill="#B94432" />
      <path d="M104 36h10a6 6 0 0 1 0 12h-10z" fill="#B94432" />
      <path d="M24 36H14a6 6 0 0 0 0 12h10z" fill="#B94432" />
      {LOGO_BARS.map(([x, y, h]) => (
        <rect
          key={x}
          x={x}
          y={y}
          width="5.5"
          height={h}
          rx="2.75"
          fill={`url(#${grad})`}
        />
      ))}
    </svg>
  );
}

/** 대화 카드 발치에 놓이는 작은 파형. 숨 쉬듯 위아래로 움직인다. */
const SMALL_BARS = [4.2, 6.06, 13.86, 13.8, 16.51, 18.37, 10.51, 5.98, 4.2];

/** 마무리 구역을 받치는 큰 파형. 정지 상태. */
const LARGE_BARS = [
  7.2, 7.2, 15.74, 24.45, 20.68, 38.48, 46.73, 33.96, 55.46, 62.06, 42.23,
  63.64, 67.64, 43.89, 61.63, 62.42, 38.5, 49.89, 47.27, 26.88, 30.57, 24.87,
  11.07, 7.43, 7.2,
];

export function Waveform({
  variant,
  id,
}: {
  variant: "sm" | "lg";
  id: string;
}) {
  const grad = `wave-grad-${id}`;
  const sm = variant === "sm";
  const bars = sm ? SMALL_BARS : LARGE_BARS;
  const w = sm ? 3.5 : 6;
  const step = sm ? 6.1 : 12;
  const height = sm ? 24 : 86;
  const width = step * (bars.length - 1) + w;
  const top = sm ? 4 : 16;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={grad}
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1={height}
          x2="0"
          y2={top}
        >
          {STOPS}
        </linearGradient>
      </defs>
      {bars.map((h, i) => (
        <rect
          key={i}
          className={sm ? "bar" : undefined}
          style={sm ? { animationDelay: `${(i * 0.09).toFixed(2)}s` } : undefined}
          x={(i * step).toFixed(2)}
          y={(height - h).toFixed(2)}
          width={w}
          height={h}
          rx={w / 2}
          fill={`url(#${grad})`}
        />
      ))}
    </svg>
  );
}
