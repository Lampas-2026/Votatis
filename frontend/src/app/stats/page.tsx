import "../app-shell.css";
import SiteHeader from "@/components/layout/SiteHeader";
import { IChart } from "@/components/mock/mock-icons";

export const metadata = { title: "통계 — Votatis" };

// TODO: GET /api/stats 연동. 현재는 집계 데이터 소스가 없어 빈 상태.
export default function StatsPage() {
  return (
    <>
      <SiteHeader />
      <div className="page-wrap">
        <div className="page-head">
          <h1>통계</h1>
          <div className="sub">유형·지역·시점별 분포를 집계해 공개합니다. 모든 수치는 검증 상태별로 구분됩니다.</div>
        </div>

        <div className="chartc" style={{ marginBottom: 12 }}>
          <div className="t">일자별 제보 접수 추이</div>
          <div className="empty" style={{ background: "#fff" }}>
            <div className="ic">
              <IChart size={22} />
            </div>
            <h4>집계할 데이터가 없습니다</h4>
            <p>제보가 쌓이면 일자별 접수·검증 추이가 이곳에 표시됩니다.</p>
          </div>
        </div>

        <div className="vizg">
          <div className="chartc">
            <div className="t">카테고리별 분포</div>
            {["A 선거", "B 집회·시위", "C 공익"].map((l, i) => (
              <div className="hbar" key={l} style={i === 2 ? { marginBottom: 0 } : undefined}>
                <div className="hl">
                  <span>{l}</span>
                  <b>0</b>
                </div>
                <div className="track">
                  <i style={{ width: "0%" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="chartc">
            <div className="t">검증 상태별 분포</div>
            {["사실확인", "검토중", "반박됨"].map((l, i) => (
              <div className="hbar" key={l} style={i === 2 ? { marginBottom: 0 } : undefined}>
                <div className="hl">
                  <span>{l}</span>
                  <b>0</b>
                </div>
                <div className="track">
                  <i style={{ width: "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
