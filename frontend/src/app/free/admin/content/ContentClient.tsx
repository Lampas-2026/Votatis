"use client";

import { useState } from "react";
import AdminShell from "@/components/web/AdminShell";
import { IEdit, IPlus } from "@/components/mock/mock-icons";

type Tab = "notice" | "info";

// TODO: GET /api/admin/content?type={tab} 연동. 현재 빈 목록.
export default function ContentClient() {
  const [tab, setTab] = useState<Tab>("notice");

  return (
    <AdminShell
      active="content"
      title="정보·공지"
      sub="공개 페이지에 게시되는 공지·안내 글 관리"
      right={
        <div className="seg">
          <b className={tab === "notice" ? "on" : ""} onClick={() => setTab("notice")}>
            공지
          </b>
          <b className={tab === "info" ? "on" : ""} onClick={() => setTab("info")}>
            정보
          </b>
        </div>
      }
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        {/* TODO: POST /api/admin/content (작성 모달/에디터) */}
        <button
          className="lbtn"
          style={{ width: "auto", padding: "0 18px", height: 40, display: "inline-flex", alignItems: "center", gap: 7 }}
        >
          <IPlus size={15} />
          {tab === "notice" ? "공지 작성" : "정보 작성"}
        </button>
      </div>
      <div className="panel">
        <div className="ph">
          {tab === "notice" ? "공지 목록" : "정보 글 목록"} <span className="more">최신순</span>
        </div>
        <div className="empty" style={{ background: "#fff" }}>
          <div className="ic">
            <IEdit size={22} />
          </div>
          <h4>{tab === "notice" ? "등록된 공지가 없습니다" : "등록된 정보 글이 없습니다"}</h4>
          <p>
            작성한 글은 공개 페이지에 게시되며 수정·게시중단 이력이 감사 로그에 남습니다.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
