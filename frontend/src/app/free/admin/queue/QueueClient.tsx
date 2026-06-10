"use client";

import { useState } from "react";
import AdminShell from "@/components/web/AdminShell";
import { Tile } from "@/components/ui";
import { ICheckSq } from "@/components/mock/mock-icons";

type Tab = "wait" | "supplement" | "done";

// TODO: GET /api/admin/queue?tab={tab} 연동. 현재 빈 큐.
export default function QueueClient() {
  const [tab, setTab] = useState<Tab>("wait");

  return (
    <AdminShell
      active="queue"
      title="검토 큐"
      sub="검증 대기 0건"
      right={
        <div className="seg">
          <b className={tab === "wait" ? "on" : ""} onClick={() => setTab("wait")}>
            대기
          </b>
          <b className={tab === "supplement" ? "on" : ""} onClick={() => setTab("supplement")}>
            보완
          </b>
          <b className={tab === "done" ? "on" : ""} onClick={() => setTab("done")}>
            완료
          </b>
        </div>
      }
    >
      <div className="tiles">
        <Tile tone="pt-rl" label="대기" value="0" note="검증 전" dir="dn" />
        <Tile tone="pt-red" label="오늘 승인" value="0" note="처리" dir="dn" />
        <Tile tone="pt-g" label="평균 검토" value="—" note="소요" dir="dn" />
        <Tile tone="pt-dk" label="반박률" value="—" note="누적" dir="dn" />
      </div>
      <div className="prow adm">
        <div className="panel">
          <div className="ph">
            {tab === "wait" ? "대기 항목" : tab === "supplement" ? "보완 항목" : "완료 항목"}{" "}
            <span className="more">우선순위순</span>
          </div>
          <div className="empty" style={{ background: "#fff" }}>
            <div className="ic">
              <ICheckSq size={22} />
            </div>
            <h4>
              {tab === "wait" ? "검토 대기 항목이 없습니다" : tab === "supplement" ? "보완 항목이 없습니다" : "완료 항목이 없습니다"}
            </h4>
            <p>제보가 접수되면 검토 큐에 등록되어 이곳에 나타납니다.</p>
          </div>
        </div>
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="ph">검증 패널</div>
          <p style={{ fontSize: 12, color: "var(--g500)", lineHeight: 1.6 }}>
            왼쪽에서 항목을 선택하면 원본 대조·근거 입력 후 승인/보완/거절을 진행합니다. 모든 판정은 근거와 함께 감사 로그에 기록됩니다.
          </p>
          <div className="act" style={{ marginTop: "auto", opacity: 0.5, pointerEvents: "none" }}>
            <div className="a1">승인</div>
            <div className="a2">보완</div>
            <div className="a3">✕</div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
