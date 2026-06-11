import type { ReactNode } from "react";
import Link from "next/link";
import { IGrid, IUsers, IList, ICheckSq, IImage, IChart, IEdit } from "@/components/mock/mock-icons";
import Torch from "@/components/landing/Torch";

export type AdminNav = "dashboard" | "members" | "reports" | "queue" | "evidence" | "content";

const ITEMS: { key: AdminNav; label: string; href: string; Icon: typeof IGrid; cnt?: string }[] = [
  { key: "dashboard", label: "대시보드", href: "/free/admin/dashboard", Icon: IGrid },
  { key: "members", label: "회원", href: "/free/admin/members", Icon: IUsers },
  { key: "reports", label: "제보", href: "/free/admin/queue", Icon: IList },
  { key: "queue", label: "검토 큐", href: "/free/admin/queue", Icon: ICheckSq },
  { key: "evidence", label: "원본 데이터", href: "/free/admin/evidence/0153", Icon: IImage },
];

/** 관리자 콘솔 공용 셸 (사이드바 + 메인). 실동작 레이아웃. */
export default function AdminShell({
  active,
  title,
  sub,
  right,
  children,
}: {
  active: AdminNav;
  title: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="win" style={{ boxShadow: "none", borderRadius: 14 }}>
      <div className="dash">
        <aside className="dside">
          <div className="ds-logo">
            <Torch size={24} />관리자
          </div>
          <div className="ds-sec">운영</div>
          {ITEMS.map((it) => (
            <Link key={it.key + it.href} href={it.href} className={`ds-item${active === it.key ? " on" : ""}`}>
              <it.Icon />
              {it.label}
              {it.cnt && <span className="cnt">{it.cnt}</span>}
            </Link>
          ))}
          <div className="ds-sec">콘텐츠</div>
          <Link href="/free/admin/dashboard" className={`ds-item${active === "content" ? " on" : ""}`}>
            <IEdit />정보·공지
          </Link>
          <div className="ds-sec">바로가기</div>
          <Link href="/free/preview" className="ds-item">
            <IChart />화면 미리보기
          </Link>
        </aside>
        <div className="dmain">
          <div className="dh">
            <div>
              <h3>{title}</h3>
              {sub && <div className="sub">{sub}</div>}
            </div>
            {right}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
