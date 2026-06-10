import Link from "next/link";
import Torch from "@/components/landing/Torch";

const GITHUB = "https://github.com/Lampas-2026/Votatis";

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <a className="brand" href="#top">
              <Torch size={28} />
              Votatis
            </a>
            <p>
              시민이 함께 만드는 검증 가능한 오픈소스 제보 아카이브. 코드와 데이터
              포맷, 검증 절차를 모두 공개합니다.
            </p>
          </div>
          <div className="foot-cols">
            <div className="foot-col">
              <h5>제품</h5>
              <a href="#archive">공개 아카이브</a>
              <a href="#admin">검증 시스템</a>
              <Link href="/report">제보하기</Link>
            </div>
            <div className="foot-col">
              <h5>둘러보기</h5>
              <Link href="/archive">공개 아카이브</Link>
              <Link href="/stats">통계</Link>
              <Link href="/free/preview">화면 미리보기</Link>
            </div>
            <div className="foot-col">
              <h5>오픈소스</h5>
              <a href={GITHUB} target="_blank" rel="noopener">
                GitHub
              </a>
              <a href={`${GITHUB}/issues`} target="_blank" rel="noopener">
                검증 큐
              </a>
            </div>
          </div>
        </div>
        <p className="foot-note">
          <strong>고지.</strong> Votatis는 특정 선거가 조작되었다고 단정하는
          플랫폼이 아닙니다. 제보는 주장으로 접수되어 검증 절차를 거치며, 검증
          상태가 함께 공개됩니다. 사실관계 판단과 공식 이의 제기는
          중앙선거관리위원회 등 권한 있는 기관의 절차를 따릅니다. 개인 식별 정보는
          저장하지 않으며, 정정·삭제 요청 경로를 제공합니다. 화면의 수치와 기록은
          데모용 예시입니다.
        </p>
      </div>
    </footer>
  );
}
