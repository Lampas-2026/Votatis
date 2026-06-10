import "../app-shell.css";
import SiteHeader from "@/components/layout/SiteHeader";
import ArchiveClient from "./ArchiveClient";

export const metadata = { title: "공개 아카이브 — Votatis" };

export default function ArchivePage() {
  return (
    <>
      <SiteHeader />
      <div className="page-wrap">
        <div className="page-head">
          <h1>공개 아카이브</h1>
          <div className="sub">검증을 통과한 기록만 공개됩니다. 모든 기록에는 검증 상태가 함께 표시됩니다.</div>
        </div>
        <ArchiveClient />
      </div>
    </>
  );
}
