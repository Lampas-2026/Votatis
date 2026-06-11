/** 파비콘과 동일한 자유의 횃불 마크. 로고 자리에 재사용. */
type Props = { size?: number; className?: string };

export default function Torch({ size = 28, className }: Props) {
  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      }}
    >
      {/* favicon.svg와 1:1 동일 (배경 #c01616, rx 14/64) */}
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <rect x="0" y="0" width="64" height="64" rx="14" fill="#c01616" />
        <path
          d="M32 6 C24 16 22 24 27 31 C28 26 30 24 32 22 C34 28 40 31 38 38 C45 33 45 20 37 12 C36 16 34 17 33 15 C34 11 33 9 32 6 Z"
          fill="#ffd23f"
        />
        <path
          d="M32 14 C28 20 27 25 30 29 C31 26 31.5 25 32 24 C33 27 35 29 34 33 C38 30 38 22 34 18 C33.5 20 33 20 32.5 19 C33 17 32.5 15.5 32 14 Z"
          fill="#ff7a18"
        />
        <path d="M22 40 H42 L38 46 H26 Z" fill="#ffe08a" />
        <rect x="29" y="46" width="6" height="10" rx="2" fill="#ffc839" />
        <rect x="25" y="54" width="14" height="5" rx="2" fill="#ffe08a" />
      </svg>
    </span>
  );
}
