import "../../app-shell.css";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import { IShield } from "@/components/mock/mock-icons";

// 정적 export(SSG): 레코드 상세는 빌드 타임에 id 목록을 알 수 없고(공개 조회 API 미연동, mock 빈 상태)
// 사전 생성 인스턴스 없음. 실 데이터 연동(별도 스펙) 시 generateStaticParams 로 채운다.
export const dynamicParams = false;
export function generateStaticParams(): { id: string }[] {
  return [{ id: "none" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `${id} — Votatis 레코드` };
}

export default async function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // TODO: GET /api/records/{id} 연동. 현재는 데이터 소스가 없어 빈 상태.
  return (
    <>
      <SiteHeader />
      <div className="page-wrap">
        <div style={{ marginBottom: 14 }}>
          <Link href="/archive" style={{ fontSize: 13, fontWeight: 700, color: "var(--g600)" }}>
            ← 아카이브
          </Link>
        </div>
        <div className="rdoc">
          <div className="rdh">
            <span className="chip c-unv">
              <span className="pt" />레코드 없음
            </span>
            <span className="rid">{id}</span>
          </div>
          <div className="empty" style={{ marginTop: 8 }}>
            <div className="ic">
              <IShield size={22} />
            </div>
            <h4>해당 레코드를 찾을 수 없습니다</h4>
            <p>
              요청하신 식별자의 공개 레코드가 존재하지 않거나 아직 검증되지 않았습니다.
              <br />
              검증을 통과한 기록만 공개되며, 모든 기록에는 출처·무결성 해시·검증 이력이 함께 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
