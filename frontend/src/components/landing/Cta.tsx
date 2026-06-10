import Link from "next/link";
import Reveal from "./Reveal";

export default function Cta() {
  return (
    <section className="cta-sec">
      <div className="wrap">
        <Reveal>
          <div className="cta-inner">
            <h2>
              현장을 보셨다면,
              <br />
              기록으로 남겨주세요.
            </h2>
            <p>
              한 건의 제보가 곧 사실은 아닙니다. 검증을 거쳐 신뢰할 수 있는 기록으로
              만드는 일에 함께해주세요.
            </p>
            <div className="hero-cta" style={{ marginBottom: 0 }}>
              <Link className="btn btn-primary btn-lg" href="/report">
                제보 보내기
              </Link>
              <a
                className="btn btn-soft btn-lg"
                href="https://github.com/Lampas-2026/Votatis"
                target="_blank"
                rel="noopener"
              >
                프로젝트 기여하기
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
