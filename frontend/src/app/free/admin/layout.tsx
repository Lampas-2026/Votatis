import "../../app-shell.css";
import "../mock.css";
import Link from "next/link";
import type { ReactNode } from "react";
import Torch from "@/components/landing/Torch";

export const metadata = {
  title: "관리자 콘솔 — Votatis",
};

/** /free/admin/* 공용 레이아웃: 상단 바 + 캔버스 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mock-canvas" style={{ minHeight: "100vh" }}>
      <header className="nav" style={{ background: "var(--g900)", borderBottom: "none" }}>
        <div className="wrap nav-inner">
          <Link className="brand" href="/free/admin/dashboard" style={{ color: "#fff" }}>
            <Torch size={28} />관리자 콘솔
          </Link>
          <nav className="nav-links">
            <Link href="/free/preview" style={{ color: "var(--g300)" }}>
              화면 미리보기
            </Link>
            <Link href="/" style={{ color: "var(--g300)" }}>
              서비스 홈
            </Link>
          </nav>
        </div>
      </header>
      <div className="board">{children}</div>
    </div>
  );
}
