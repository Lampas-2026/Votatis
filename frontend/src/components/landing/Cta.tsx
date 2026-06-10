import Link from "next/link";
import Reveal from "./Reveal";

export default function Cta() {
  return (
    <section className="cta-sec">
      <DemocracyBg />
      <div className="wrap">
        <Reveal>
          <div className="cta-inner">
            <h2>
              현장을 보셨다면,
              <br />
              기록으로 남겨주세요.
            </h2>
            <p>
              한 건의 제보가 곧 사실은 아닙니다. 검증을 거쳐 신뢰할 수 있는
              <br />
              기록으로 만드는 일에 함께해주세요.
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

/** 민주주의 상징 — 투표함에 모이는 시민(점)들, 손, 체크. 추상 라인 SVG. */
function DemocracyBg() {
  return (
    <svg
      className="cta-bg"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <radialGradient id="cg" cx="50%" cy="38%" r="62%">
          <stop offset="0" stopColor="#ff5a4d" stopOpacity="0.26" />
          <stop offset="0.55" stopColor="#c01616" stopOpacity="0.10" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="600" fill="url(#cg)" />

      {/* 방사형 시민 점들 — 한 점(투표함)으로 모이는 참여 */}
      <g fill="#ff6a5a" opacity="0.5">
        {Array.from({ length: 56 }).map((_, i) => {
          const a = (i / 56) * Math.PI * 2;
          const r = 150 + (i % 7) * 34;
          const cx = 600 + Math.cos(a) * r * 1.55;
          const cy = 300 + Math.sin(a) * r * 0.78;
          return <circle key={i} cx={cx} cy={cy} r={i % 5 === 0 ? 3.4 : 2} />;
        })}
      </g>

      {/* 중앙 투표함 */}
      <g
        stroke="#ff7a6b"
        strokeWidth="2.4"
        fill="none"
        opacity="0.85"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M540 330 L600 312 L660 330 L660 392 L600 410 L540 392 Z" />
        <path d="M540 330 L600 348 L660 330" />
        <path d="M600 348 L600 410" />
        {/* 투표용지 투입구 */}
        <path d="M576 328 L600 320 L624 328" />
        {/* 들어가는 용지 */}
        <path d="M588 300 L612 292 L612 318 L588 326 Z" fill="#ff7a6b" fillOpacity="0.18" />
        {/* 체크 */}
        <path d="M593 306 L598 311 L608 299" strokeWidth="2.2" />
      </g>
    </svg>
  );
}
