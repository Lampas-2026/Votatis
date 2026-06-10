import AdminShell from "@/components/web/AdminShell";
import { Tile } from "@/components/ui";
import { IList } from "@/components/mock/mock-icons";

export const metadata = { title: "관리자 대시보드 — Votatis" };

// TODO: GET /api/admin/overview 연동. 현재 데이터 소스 없어 0/빈 상태.
export default function AdminDashboardPage() {
  return (
    <AdminShell
      active="dashboard"
      title="대시보드"
      sub="제9회 지방선거 · 운영 현황"
      right={
        <div className="seg">
          <b className="on">오늘</b>
          <b>주간</b>
          <b>전체</b>
        </div>
      }
    >
      <div className="tiles">
        <Tile tone="pt-g" label="총 회원" value="0" note="—" dir="dn" />
        <Tile tone="pt-rl" label="총 제보" value="0" note="—" dir="dn" />
        <Tile tone="pt-red" label="검증 대기" value="0" note="검토 큐" dir="dn" />
        <Tile tone="pt-dk" label="원본 보관" value="0" note="R2·봉인" dir="dn" />
      </div>
      <div className="prow adm">
        <div className="panel">
          <div className="ph">
            최근 제보 <span className="more">전체 보기</span>
          </div>
          <div className="empty" style={{ background: "#fff" }}>
            <div className="ic">
              <IList size={22} />
            </div>
            <h4>접수된 제보가 없습니다</h4>
            <p>제보가 들어오면 이곳과 검토 큐에 표시됩니다.</p>
          </div>
        </div>
        <div className="panel">
          <div className="ph">카테고리별 제보</div>
          {["B 집회·시위", "A 선거", "C 공익"].map((l, i) => (
            <div className="hbar" key={l} style={i === 2 ? { marginBottom: 16 } : undefined}>
              <div className="hl">
                <span>{l}</span>
                <b>0</b>
              </div>
              <div className="track">
                <i style={{ width: "0%" }} />
              </div>
            </div>
          ))}
          <div className="rate">
            <div className="rl">
              <span>신규 가입 · 오늘</span>
              <b>0명</b>
            </div>
            <div className="track">
              <i style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
