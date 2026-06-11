"use client";

import { useState } from "react";
import { CATEGORY_FULL, STATUS_LABEL, type Category, type VerifyStatus } from "@/lib/types";
import { ISearch } from "@/components/mock/mock-icons";

const CATS: (Category | "all")[] = ["all", "A", "B", "C"];
const STATUSES: (VerifyStatus | "all")[] = ["all", "confirmed", "reviewing", "debunked"];

export default function SearchClient() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");
  const [status, setStatus] = useState<VerifyStatus | "all">("all");
  const [submitted, setSubmitted] = useState(false);

  // TODO: GET /api/search?q={q}&category={cat}&status={status} 연동
  const onSearch = () => setSubmitted(true);

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="pi foc" style={{ minHeight: 52, marginBottom: 22 }}>
        <ISearch size={16} strokeWidth={2.2} />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSubmitted(false);
          }}
          placeholder="키워드로 검색 (예: 봉인 스티커)"
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            flex: 1,
            fontSize: 15,
            fontFamily: "var(--font)",
            color: "var(--g900)",
          }}
        />
      </div>

      <div className="pl" style={{ fontSize: 13 }}>카테고리</div>
      <div className="fchips">
        {CATS.map((c) => (
          <b
            key={c}
            className={cat === c ? "on" : ""}
            onClick={() => {
              setCat(c);
              setSubmitted(false);
            }}
          >
            {c === "all" ? "전체" : CATEGORY_FULL[c]}
          </b>
        ))}
      </div>

      <div className="pl" style={{ fontSize: 13 }}>검증 상태</div>
      <div className="fchips">
        {STATUSES.map((s) => (
          <b
            key={s}
            className={status === s ? "on" : ""}
            onClick={() => {
              setStatus(s);
              setSubmitted(false);
            }}
          >
            {s === "all" ? "전체" : STATUS_LABEL[s]}
          </b>
        ))}
      </div>

      <button className="lbtn" style={{ maxWidth: 200, marginTop: 8 }} onClick={onSearch}>
        결과 보기
      </button>

      {submitted && (
        <div className="empty" style={{ marginTop: 24 }}>
          <div className="ic">
            <ISearch size={22} />
          </div>
          <h4>검색 결과가 없습니다</h4>
          <p>
            &ldquo;{q || "전체"}&rdquo;
            {cat !== "all" && ` · ${CATEGORY_FULL[cat]}`}
            {status !== "all" && ` · ${STATUS_LABEL[status]}`} 조건에 해당하는 공개 레코드가 없습니다.
          </p>
        </div>
      )}
    </div>
  );
}
