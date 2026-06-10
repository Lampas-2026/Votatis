/** 랜딩에서 반복 사용하는 인라인 SVG 아이콘. stroke=currentColor 상속. */
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...rest }: P) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    ...rest,
  };
}

export const Lock = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2.2}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

export const Grid = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
  </svg>
);

export const Search = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);

export const Pin = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const Chart = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </svg>
);

export const Check = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2.4}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const CheckSquare = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M9 11l3 3 8-8" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const Link = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
  </svg>
);

export const Shield = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export const Image = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 1.6}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

export const X = (p: P) => (
  <svg
    {...base(p)}
    strokeWidth={(p.strokeWidth as number) ?? 2.4}
    strokeLinecap="round"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const List = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M4 7h16M4 12h10M4 17h7" />
  </svg>
);

export const Gear = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1z" />
  </svg>
);

export const Upload = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M12 16V4M7 9l5-5 5 5" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const SearchBig = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const Home = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <path d="M9 22V12h6v10" />
  </svg>
);

export const BadgeCheck = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

export const Expand = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
  </svg>
);

export const EyeOff = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
    <path d="M4 4l16 16" />
  </svg>
);

export const Edit = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export const Users = (p: P) => (
  <svg {...base(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);
