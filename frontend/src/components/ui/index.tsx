import type { Category, VerifyStatus } from "@/lib/types";
import { CATEGORY_FULL, STATUS_CHIP, STATUS_LABEL } from "@/lib/types";

/** 검증 상태 칩 */
export function StatusChip({
  status,
  sm,
}: {
  status: VerifyStatus;
  sm?: boolean;
}) {
  return (
    <span className={`chip ${sm ? "sm " : ""}${STATUS_CHIP[status]}`}>
      <span className="pt" />
      {STATUS_LABEL[status]}
    </span>
  );
}

/** 카테고리 배지 A/B/C */
export function CatBadge({
  category,
  full,
  size,
}: {
  category: Category;
  full?: boolean;
  size?: number;
}) {
  if (full) {
    return (
      <span
        className={`catb cat-${category.toLowerCase()}`}
        style={{ width: "auto", padding: "0 8px", lineHeight: "26px", height: 26 }}
      >
        {CATEGORY_FULL[category]}
      </span>
    );
  }
  const s = size
    ? { width: size, height: size, lineHeight: `${size}px`, fontSize: size <= 16 ? 9 : 11 }
    : undefined;
  return (
    <span className={`catb cat-${category.toLowerCase()}`} style={s}>
      {category}
    </span>
  );
}

/** 통계 타일 */
export function Tile({
  tone,
  label,
  value,
  note,
  dir,
}: {
  tone: string;
  label: string;
  value: React.ReactNode;
  note: string;
  dir: string;
}) {
  return (
    <div className="tile">
      <div className="tl">
        <span className={`pt ${tone}`} />
        {label}
      </div>
      <div className="tv">{value}</div>
      <div className={`td ${dir}`}>{note}</div>
    </div>
  );
}

/** 진행 바 */
export function Track({ width }: { width: string }) {
  return (
    <div className="track">
      <i style={{ width }} />
    </div>
  );
}

/** 수평 막대 (라벨·값·바) */
export function HBar({
  label,
  value,
  width,
  last,
}: {
  label: string;
  value: React.ReactNode;
  width: string;
  last?: boolean;
}) {
  return (
    <div className="hbar" style={last ? { marginBottom: 0 } : undefined}>
      <div className="hl">
        <span>{label}</span>
        <b>{value}</b>
      </div>
      <Track width={width} />
    </div>
  );
}

/** 검증 상태 분포 도넛 */
export function Donut({
  total,
  caption = "전체",
}: {
  total: number | string;
  caption?: string;
}) {
  return (
    <div className="donut">
      <div className="c">
        <b>{total}</b>
        <span>{caption}</span>
      </div>
    </div>
  );
}
