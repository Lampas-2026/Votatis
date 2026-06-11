import AdminShell from "@/components/web/AdminShell";
import { IUsers } from "@/components/mock/mock-icons";

export const metadata = { title: "회원 관리 — Votatis" };

// TODO: GET /api/admin/members 연동.
export default function AdminMembersPage() {
  return (
    <AdminShell
      active="members"
      title="회원 관리"
      sub="총 0명 · 익명 ID 기준"
      right={<div className="dsearch">익명 ID 검색</div>}
    >
      <div className="prow adm">
        <div className="panel">
          <div className="ph">
            회원 목록 <span className="more">필터</span>
          </div>
          <div className="empty" style={{ background: "#fff" }}>
            <div className="ic">
              <IUsers size={22} />
            </div>
            <h4>회원이 없습니다</h4>
            <p>가입한 익명 회원이 이곳에 표시됩니다. 실명·연락처는 저장하지 않습니다.</p>
          </div>
        </div>
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="ph">회원 상세</div>
          <p style={{ fontSize: "12.5px", color: "var(--g500)", lineHeight: 1.6 }}>
            왼쪽 목록에서 회원을 선택하면 가입일·제보 수·활동 로그·제재 옵션이 표시됩니다.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
