import AdminShell from "@/components/web/AdminShell";
import { IShield, IImage } from "@/components/mock/mock-icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `원본 검수 ${id} — Votatis` };
}

// TODO: GET /api/admin/evidence/{id} 연동. 접근 시 감사 로그 기록.
export default async function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminShell active="evidence" title="원본 데이터 검수" sub={`evidence/${id} · 감사 로그 기록`}>
      <div className="privacy">
        <IShield size={18} />
        <p>
          원본은 관리자만 열람하며 모든 접근이 기록됩니다. 공개 아카이브에는 얼굴·번호판이 자동 마스킹된 버전만 게시됩니다.
        </p>
      </div>
      <div className="prow" style={{ gridTemplateColumns: "1.4fr .6fr", gap: 14 }}>
        <div className="panel">
          <div className="ph">
            증거 원본
            <div className="seg" style={{ marginLeft: "auto" }}>
              <b className="on">원본</b>
              <b>마스킹</b>
            </div>
          </div>
          <div className="empty" style={{ background: "#fff" }}>
            <div className="ic">
              <IImage size={22} />
            </div>
            <h4>원본이 없습니다</h4>
            <p>해당 식별자의 봉인된 원본이 존재하지 않거나 접근 권한이 없습니다.</p>
          </div>
        </div>
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="ph">제보 · 메타데이터</div>
          <div className="kv"><b>식별자</b> {id}</div>
          <div className="kv"><b>제보자</b> —</div>
          <div className="kv"><b>촬영·기기·GPS</b> —</div>
          <div className="rsec" style={{ marginTop: 12 }}>접근 로그</div>
          <div className="kv">현재 세션 열람 기록이 감사 로그에 남습니다.</div>
        </div>
      </div>
    </AdminShell>
  );
}
