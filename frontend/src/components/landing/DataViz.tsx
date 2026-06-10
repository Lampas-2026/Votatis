import Reveal from "./Reveal";

const KPIS = [
  { v: "318", l: "전체 제보", d: "누적", up: true },
  { v: "112", l: "사실확인", d: "검증 완료", up: true },
  { v: "65%", l: "검증 처리율", d: "최근 7일", up: true },
  { v: "3.2h", l: "평균 검토 시간", d: "−18% ▾", up: false },
];

/* 유형별: 검증완료 / 검토중 스택 (총합 기준 비율 %) */
const TYPE_BARS = [
  { label: "지연", done: 62, rev: 27 },
  { label: "수치 에러", done: 51, rev: 27 },
  { label: "기타", done: 33, rev: 25 },
  { label: "훼손", done: 30, rev: 22 },
  { label: "봉인", done: 24, rev: 17 },
];

const REGION_BARS = [
  { label: "경기", v: 64, w: "100%" },
  { label: "서울", v: 58, w: "91%" },
  { label: "부산", v: 31, w: "48%" },
  { label: "인천", v: 27, w: "42%" },
  { label: "경북", v: 24, w: "37%" },
];

function StackBars({ data }: { data: typeof TYPE_BARS }) {
  const max = Math.max(...data.map((d) => d.done + d.rev));
  return (
    <>
      {data.map((b, i) => (
        <div
          key={b.label}
          className="hbar"
          style={i === data.length - 1 ? { marginBottom: 0 } : undefined}
        >
          <div className="hl">
            <span>{b.label}</span>
            <b>{b.done + b.rev}</b>
          </div>
          <div className="track stack">
            <i style={{ width: `${(b.done / max) * 100}%` }} />
            <i
              className="rev"
              style={{ width: `${(b.rev / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

function PlainBars({ data }: { data: typeof REGION_BARS }) {
  return (
    <>
      {data.map((b, i) => (
        <div
          key={b.label}
          className="hbar"
          style={i === data.length - 1 ? { marginBottom: 0 } : undefined}
        >
          <div className="hl">
            <span>{b.label}</span>
            <b>{b.v}</b>
          </div>
          <div className="track">
            <i style={{ width: b.w }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function DataViz() {
  return (
    <section className="sec sec-center" id="viz">
      <div className="wrap">
        <Reveal style={{ maxWidth: "52ch", margin: "0 auto" }}>
          <p className="eyebrow">데이터로 보는 아카이브</p>
          <h2>
            제보가 쌓일수록
            <br />
            패턴이 보입니다.
          </h2>
          <p className="desc">
            유형·지역·시점별 분포를 집계해 공개합니다. 모든 수치는 검증 상태별로
            구분됩니다.
          </p>
        </Reveal>

        {/* KPI 스트립 */}
        <Reveal className="kpi-strip">
          {KPIS.map((k) => (
            <div className="kpi" key={k.l}>
              <div className="kv">{k.v}</div>
              <div className="kl">{k.l}</div>
              <div className={`kd ${k.up ? "up" : "dn"}`}>{k.d}</div>
            </div>
          ))}
        </Reveal>

        {/* 메인 라인 차트 */}
        <Reveal style={{ marginTop: 14, textAlign: "left" }}>
          <div className="chart-card">
            <div className="ch-head">
              <div>
                <div className="t">일자별 제보 접수 추이</div>
                <div className="s">제9회 지방선거 · 최근 7일</div>
              </div>
              <div className="ch-legend">
                <span>
                  <i style={{ background: "var(--red)" }} />접수
                </span>
                <span>
                  <i style={{ background: "var(--g300)" }} />검증 완료
                </span>
              </div>
            </div>
            <svg
              viewBox="0 0 720 240"
              style={{ width: "100%", height: "auto" }}
              aria-label="접수 추이"
            >
              {/* y축 그리드 + 라벨 */}
              <g
                stroke="var(--g100)"
                strokeWidth="1"
                fontSize="10"
                fill="var(--g400)"
              >
                {[
                  { y: 30, v: "120" },
                  { y: 78, v: "80" },
                  { y: 126, v: "40" },
                  { y: 174, v: "0" },
                ].map((g) => (
                  <g key={g.y}>
                    <line x1="32" y1={g.y} x2="720" y2={g.y} />
                    <text x="0" y={g.y + 3} fontWeight="600">
                      {g.v}
                    </text>
                  </g>
                ))}
              </g>
              {/* 선거일 마커 */}
              <line
                x1="492"
                y1="20"
                x2="492"
                y2="200"
                stroke="var(--red-line)"
                strokeWidth="1.5"
                strokeDasharray="3 4"
              />
              <text
                x="492"
                y="16"
                fontSize="10"
                fontWeight="700"
                fill="var(--red)"
                textAnchor="middle"
              >
                6/3 선거일
              </text>
              {/* 접수 면적 */}
              <path
                d="M32,168 L142,154 L252,124 L362,74 L492,44 L602,98 L712,132 L712,200 L32,200 Z"
                fill="var(--red)"
                opacity="0.08"
              />
              {/* 접수 라인 */}
              <path
                d="M32,168 L142,154 L252,124 L362,74 L492,44 L602,98 L712,132"
                fill="none"
                stroke="var(--red)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* 검증 완료 라인 */}
              <path
                d="M32,188 L142,180 L252,164 L362,142 L492,120 L602,152 L712,170"
                fill="none"
                stroke="var(--g300)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2 7"
              />
              {/* 포인트 + 피크 라벨 */}
              <g fill="var(--red)">
                <circle cx="252" cy="124" r="4" />
                <circle cx="362" cy="74" r="4" />
                <circle cx="492" cy="44" r="6" stroke="#fff" strokeWidth="2.5" />
              </g>
              <g>
                <rect
                  x="462"
                  y="20"
                  width="60"
                  height="20"
                  rx="6"
                  fill="var(--red)"
                />
                <text
                  x="492"
                  y="34"
                  fontSize="11"
                  fontWeight="800"
                  fill="#fff"
                  textAnchor="middle"
                >
                  최고 118
                </text>
              </g>
            </svg>
            <div className="ch-xaxis">
              <span>5/29</span>
              <span>5/31</span>
              <span>6/2</span>
              <span style={{ color: "var(--red)", fontWeight: 700 }}>6/3</span>
              <span>6/4</span>
              <span>6/5</span>
              <span>6/6</span>
            </div>
          </div>
        </Reveal>

        <Reveal className="viz-grid">
          <div className="chart-card" style={{ textAlign: "left" }}>
            <div className="ch-head">
              <div>
                <div className="t">유형별 분포</div>
              </div>
              <div className="ch-legend">
                <span>
                  <i style={{ background: "var(--red)" }} />검증
                </span>
                <span>
                  <i style={{ background: "var(--red-300)" }} />검토중
                </span>
              </div>
            </div>
            <StackBars data={TYPE_BARS} />
          </div>
          <div className="chart-card" style={{ textAlign: "left" }}>
            <div className="ch-head">
              <div>
                <div className="t">지역별 분포 (상위)</div>
              </div>
            </div>
            <PlainBars data={REGION_BARS} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
