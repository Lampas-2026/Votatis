"use client";

import { useState } from "react";
import AdminShell from "@/components/web/AdminShell";
import { Tile } from "@/components/ui";
import {
  CATEGORY_FULL,
  STATUS_LABEL,
  type Category,
  type VerifyStatus,
} from "@/lib/types";
import { IList } from "@/components/mock/mock-icons";

const CATS: (Category | "all")[] = ["all", "A", "B", "C"];
const STATUSES: (VerifyStatus | "all")[] = [
  "all",
  "confirmed",
  "reviewing",
  "unverified",
  "disputed",
  "debunked",
  "corrected",
];

// TODO: GET /api/admin/reports?category={cat}&status={status} 연동. 현재 빈 목록.
export default function ReportsClient() {
  const [cat, setCat] = useState<Category | "all">("all");
  const [status, setStatus] = useState<VerifyStatus | "all">("all");

  const filterLabel = [
    cat !== "all" && CATEGORY_FULL[cat],
    status !== "all" && STATUS_LABEL[status],
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <AdminShell
      active="reports"
      title="제보 관리"
      sub={`전체 0건${filterLabel ? ` · ${filterLabel}` : ""}`}
      right={<div className="dsearch">제보 검색</div>}
    >
      <div className="tiles">
        <Tile tone="pt-g" label="전체 제보" value="0" note="누적" dir="dn" />
        <Tile tone="pt-rl" label="검토중" value="0" note="진행" dir="dn" />
        <Tile tone="pt-red" label="사실확인" value="0" note="공개" dir="dn" />
        <Tile tone="pt-dk" label="반박·정정" value="0" note="보존" dir="dn" />
      </div>

      <div className="fchips">
        {CATS.map((c) => (
          <b key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>
            {c === "all" ? "전체 카테고리" : CATEGORY_FULL[c]}
          </b>
        ))}
      </div>
      <div className="fchips">
        {STATUSES.map((s) => (
          <b key={s} className={status === s ? "on" : ""} onClick={() => setStatus(s)}>
            {s === "all" ? "전체 상태" : STATUS_LABEL[s]}
          </b>
        ))}
      </div>

      <div className="panel">
        <div className="ph">
          제보 목록 <span className="more">최신순</span>
        </div>
        <div className="empty" style={{ background: "#fff" }}>
          <div className="ic">
            <IList size={22} />
          </div>
          <h4>제보가 없습니다</h4>
          <p>
            접수된 제보가 이곳에 카테고리·검증 상태와 함께 표시됩니다.
            <br />
            행을 선택하면 상세 확인 후 검토 큐로 보낼 수 있습니다.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
