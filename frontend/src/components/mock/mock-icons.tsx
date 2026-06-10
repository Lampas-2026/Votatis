/* 목업 화면용 SVG 아이콘 (web.html / app.html에서 사용한 패스 그대로) */
import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement> & { size?: number };
const b = ({ size = 16, ...r }: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  ...r,
});

export const ILock = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2.2}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
export const IGrid = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
  </svg>
);
export const ISearch = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4-4" />
  </svg>
);
export const IPin = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
export const IChart = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </svg>
);
export const IUsers = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);
export const IList = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M4 7h16M4 12h10M4 17h7" />
  </svg>
);
export const ICheckSq = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M9 11l3 3 8-8" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
export const IImage = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 1.5}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);
export const IEdit = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);
export const IShield = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
export const IX = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2.4} strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const ICamera = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);
export const ICheck = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2.4} strokeLinecap="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
export const IPlus = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2.6} strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IBack = (p: P) => (
  <svg {...b(p)} strokeWidth={(p.strokeWidth as number) ?? 2.4} strokeLinecap="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

/** 모바일 상태바 (배터리·신호) */
export const StatusBar = () => (
  <div className="sbar">
    <span>9:41</span>
    <span className="ic">
      <svg width="17" height="12" viewBox="0 0 18 12" fill="currentColor">
        <rect x="0" y="7" width="3" height="5" rx="1" />
        <rect x="4.5" y="4.5" width="3" height="7.5" rx="1" />
        <rect x="9" y="2" width="3" height="10" rx="1" />
        <rect x="13.5" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg width="22" height="12" viewBox="0 0 24 12" fill="none">
        <rect x="1" y="1" width="19" height="10" rx="3" stroke="currentColor" strokeWidth="1.2" />
        <rect x="3" y="3" width="13" height="6" rx="1.5" fill="currentColor" />
        <rect x="21" y="4" width="2" height="4" rx="1" fill="currentColor" />
      </svg>
    </span>
  </div>
);
