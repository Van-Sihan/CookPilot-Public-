/** 기능 칸에 들어가는 선 아이콘. 굵기와 끝맺음을 한 벌로 맞춰 둔다. */

export type IconName = "mic" | "play" | "fridge" | "timer" | "scale" | "book";

const shared = {
  viewBox: "0 0 24 24",
  width: 24,
  height: 24,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

const paths: Record<IconName, React.ReactNode> = {
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3.5" />
      <path d="M8.5 21.5h7" />
    </>
  ),
  play: (
    <>
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
      <path d="M10.5 9.2v5.6l4.6-2.8z" fill="currentColor" stroke="none" />
    </>
  ),
  fridge: (
    <>
      <rect x="5.5" y="2.5" width="13" height="19" rx="2.5" />
      <path d="M5.5 10h13" />
      <path d="M8.5 6v2.2" />
      <path d="M8.5 12.4v2.4" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13.5" r="8" />
      <path d="M12 9.5v4h3" />
      <path d="M9.5 2.5h5" />
      <path d="M12 2.5v3" />
    </>
  ),
  scale: (
    <>
      <path d="M5 6.5h11.5l-1.1 12.2a2 2 0 0 1-2 1.8H8.1a2 2 0 0 1-2-1.8z" />
      <path d="M16.2 9.2h2.3a2.6 2.6 0 0 1 0 5.2h-1.8" />
      <path d="M8 11h4" />
      <path d="M8 14.6h2.6" />
    </>
  ),
  book: (
    <>
      <path d="M3.5 4.5h6a3 3 0 0 1 2.5 1.4A3 3 0 0 1 14.5 4.5h6v13h-6a3 3 0 0 0-2.5 1.4A3 3 0 0 0 9.5 17.5h-6z" />
      <path d="M12 5.9v13" />
    </>
  ),
};

export function Icon({ name }: { name: IconName }) {
  return <svg {...shared}>{paths[name]}</svg>;
}
