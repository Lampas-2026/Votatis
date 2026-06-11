"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CATEGORY_LABEL,
  STATUS_LABEL,
  type Category,
  type VerifyStatus,
} from "@/lib/types";
import { IGrid, ISearch, IPin, IChart } from "@/components/mock/mock-icons";
import Torch from "@/components/landing/Torch";

const CATS: Category[] = ["A", "B", "C"];
const STATUSES: VerifyStatus[] = [
  "confirmed",
  "reviewing",
  "unverified",
  "disputed",
  "debunked",
  "corrected",
];

/** 실동작 아카이브: 데이터 없음(빈 상태) + 필터·정렬 토글 작동 */
export default function ArchiveClient() {
  const [sort, setSort] = useState<"all" | "recent">("all");
  const [cat, setCat] = useState<Category | null>(null);
  const [status, setStatus] = useState<VerifyStatus | null>(null);

  return (
    <div className="win" style={{ boxShadow: "none", borderRadius: 14, marginTop: 4 }}>
      <div className="dash">
        <aside className="dside">
          <div className="ds-logo">
            <Torch size={24} />아카이브
          </div>
          <div className="ds-sec">아카이브</div>
          <div className="ds-item on">
            <IGrid />전체 기록<span className="cnt">0</span>
          </div>
          <Link href="/search" className="ds-item">
            <ISearch />검색
          </Link>
          <div className="ds-item">
            <IPin />지도
          </div>
          <Link href="/stats" className="ds-item">
            <IChart />통계
          </Link>
          <div className="ds-sec">카테고리</div>
          {CATS.map((c) => (
            <div
              key={c}
              className="ds-stat"
              style={{ cursor: "pointer", borderRadius: 9, background: cat === c ? "var(--red-bg)" : undefined }}
              onClick={() => setCat(cat === c ? null : c)}
            >
              <span className={`catb cat-${c.toLowerCase()}`} style={{ width: 16, height: 16, lineHeight: "16px", fontSize: 9 }}>
                {c}
              </span>
              {CATEGORY_LABEL[c]}
              <span className="cnt">0</span>
            </div>
          ))}
        </aside>

        <div className="dmain">
          <div className="dh">
            <div>
              <h3>전체 기록</h3>
              <div className="sub">
                제9회 지방선거 · 0건
                {cat && ` · ${CATEGORY_LABEL[cat]}`}
                {status && ` · ${STATUS_LABEL[status]}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link href="/search" className="dsearch">
                <ISearch size={13} />검색
              </Link>
              <div className="seg">
                <b className={sort === "all" ? "on" : ""} onClick={() => setSort("all")}>
                  전체
                </b>
                <b className={sort === "recent" ? "on" : ""} onClick={() => setSort("recent")}>
                  최신
                </b>
              </div>
            </div>
          </div>

          <div className="fchips">
            <b className={!status ? "on" : ""} onClick={() => setStatus(null)}>
              전체 상태
            </b>
            {STATUSES.map((s) => (
              <b key={s} className={status === s ? "on" : ""} onClick={() => setStatus(status === s ? null : s)}>
                {STATUS_LABEL[s]}
              </b>
            ))}
          </div>

          <div className="empty">
            <div className="ic">
              <IGrid size={22} />
            </div>
            <h4>표시할 기록이 없습니다</h4>
            <p>
              아직 공개된 레코드가 없습니다. 검증을 통과한 제보만 이곳에 반영됩니다.
              {/* TODO: GET /api/records?category={cat}&status={status}&sort={sort} 연동 */}
              <br />
              현장을 보셨다면 <Link href="/report" style={{ color: "var(--red)", fontWeight: 700 }}>제보</Link>로 남겨주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
