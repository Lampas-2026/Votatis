/* 웹 목업 화면 본문 (web.html 1:1). 윈도우 프레임 안에 들어가는 콘텐츠. */
import {
  IGrid,
  ISearch,
  IPin,
  IChart,
  IUsers,
  IList,
  ICheckSq,
  IImage,
  IEdit,
  IShield,
  IX,
} from "./mock-icons";

const Side = {
  Logo: ({ label = "Votatis" }: { label?: string }) => (
    <div className="ds-logo">
      <span className="ds-mk">V</span>
      {label}
    </div>
  ),
};

/* ── 1. 공개 아카이브 목록·대시보드 ──────────────────────────────────── */
export function MockArchive() {
  return (
    <div className="dash">
      <aside className="dside">
        <Side.Logo />
        <div className="ds-sec">아카이브</div>
        <div className="ds-item on">
          <IGrid />전체 기록<span className="cnt">318</span>
        </div>
        <div className="ds-item">
          <ISearch />검색
        </div>
        <div className="ds-item">
          <IPin />지도
        </div>
        <div className="ds-item">
          <IChart />통계
        </div>
        <div className="ds-sec">카테고리</div>
        <div className="ds-stat">
          <span className="catb cat-a" style={{ width: 16, height: 16, lineHeight: "16px", fontSize: 9 }}>A</span>
          선거<span className="cnt">124</span>
        </div>
        <div className="ds-stat">
          <span className="catb cat-b" style={{ width: 16, height: 16, lineHeight: "16px", fontSize: 9 }}>B</span>
          집회·시위<span className="cnt">156</span>
        </div>
        <div className="ds-stat">
          <span className="catb cat-c" style={{ width: 16, height: 16, lineHeight: "16px", fontSize: 9 }}>C</span>
          공익<span className="cnt">38</span>
        </div>
      </aside>
      <div className="dmain">
        <div className="dh">
          <div>
            <h3>전체 기록</h3>
            <div className="sub">제9회 지방선거 · 318건</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="dsearch">
              <ISearch size={13} />검색
            </div>
            <div className="seg">
              <b className="on">전체</b>
              <b>최신</b>
            </div>
          </div>
        </div>
        <div className="tiles">
          <Tile tone="pt-g" l="수집" v="318" t="전체 제보" dir="dn" />
          <Tile tone="pt-rl" l="검토중" v="64" t="▲ 12 오늘" dir="up" />
          <Tile tone="pt-red" l="사실확인" v="112" t="검증 완료" dir="up" />
          <Tile tone="pt-dk" l="반박·정정" v="63" t="기록 보존" dir="dn" />
        </div>
        <div className="prow">
          <div className="panel">
            <div className="ph">
              최근 기록 <span className="more">전체 보기</span>
            </div>
            <div className="tblw">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>제보</th>
                    <th>지역</th>
                    <th>검증</th>
                    <th>시각</th>
                  </tr>
                </thead>
                <tbody>
                  <Row cat="A" nm="투표지 수량 보고 정정 확인" region="성남 분당" chip={["c-cnf", "사실확인"]} t="2h" />
                  <Row cat="B" nm="집회 현장 과잉 진압 제보" region="서울 중구" chip={["c-rev", "검토중"]} t="3h" />
                  <Row cat="A" nm="사전투표 용지 부족 주장" region="인천 연수" chip={["c-deb", "반박됨"]} t="1d" />
                  <Row cat="B" nm="연행 현장 기록·부상자" region="서울 종로" chip={["c-unv", "미검증"]} t="1d" />
                  <Row cat="C" nm="공공시설 안전 미흡" region="대전 서구" chip={["c-dis", "이견있음"]} t="2d" />
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel">
            <div className="ph">검증 상태 분포</div>
            <div className="donutw">
              <div className="donut">
                <div className="c">
                  <b>318</b>
                  <span>전체</span>
                </div>
              </div>
              <div className="leg">
                <Leg c="var(--red)" l="사실확인" v="112" />
                <Leg c="var(--red-300)" l="검토중" v="64" />
                <Leg c="var(--g300)" l="미검증" v="51" />
                <Leg c="var(--g900)" l="반박됨" v="35" />
                <Leg c="var(--g500)" l="이견있음" v="28" />
                <Leg c="var(--g400)" l="정정됨" v="28" />
              </div>
              <div className="rate">
                <div className="rl">
                  <span>검증 처리율</span>
                  <b>65%</b>
                </div>
                <div className="track">
                  <i style={{ width: "65%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 2. 레코드 상세 ─────────────────────────────────────────────────── */
export function MockDetail() {
  return (
    <div style={{ background: "var(--g50)", padding: "clamp(16px,3vw,30px)" }}>
      <div className="rdoc">
        <div className="rdh">
          <span className="chip c-cnf">
            <span className="pt" />사실확인 · confirmed
          </span>
          <span className="rid">local9-2026-0042</span>
        </div>
        <h3>OO 개표소 투표지 수량 보고 정정 사실 확인</h3>
        <p className="sum">
          1차 집계 보고 수치가 이후 정정 공지로 수정된 사실이 확인됨. 수치 자체의 적정성은 별도 판단 대상.
        </p>
        <div className="meta">
          <span className="catb cat-a" style={{ width: "auto", padding: "0 8px", lineHeight: "26px", height: 26 }}>
            A 선거
          </span>
          <span>경기 성남 분당구</span>
          <span>2026.06.03 16:20</span>
        </div>
        <div className="rdgrid">
          <div>
            <div className="rsec">출처 · 교차확인</div>
            <div className="rsrc">· 중앙선관위 정정 공지</div>
            <div className="rsrc">· 현장 영상 원본 대조</div>
          </div>
          <div>
            <div className="rsec">반론</div>
            <p style={{ fontSize: "13.5px", color: "var(--g600)", lineHeight: 1.55 }}>
              선관위는 정정 후 수치가 최종 집계와 일치한다고 발표.
            </p>
          </div>
        </div>
        <div className="hash">
          sha256 · 9f86d0818a4b9bf1c2e4d7a3f0e9c1b8a2d4e7c9f1a3b5d7e9c2f4a6b8d0e2c4e7d
        </div>
        <div style={{ marginTop: 18, borderTop: "1px solid var(--g100)", paddingTop: 16 }}>
          <div className="rsec">검증 이력</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--g600)", marginBottom: 8 }}>
            <span className="av">A1</span>검토 시작 · 원본 영상 확보
            <span style={{ marginLeft: "auto", color: "var(--g400)" }}>06.03</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--g600)" }}>
            <span className="av" style={{ background: "var(--red-bg)", color: "var(--red-strong)" }}>A1</span>
            사실확인 승격 · 공지 교차확인
            <span style={{ marginLeft: "auto", color: "var(--g400)" }}>06.04</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 3. 통계 ────────────────────────────────────────────────────────── */
export function MockStats() {
  return (
    <div style={{ background: "var(--g50)", padding: "clamp(16px,3vw,26px)" }}>
      <div className="chartc" style={{ marginBottom: 12 }}>
        <div className="t">일자별 제보 접수 추이 · 최근 7일</div>
        <svg viewBox="0 0 720 200" style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
          <g stroke="var(--g100)" strokeWidth="1.5">
            <line x1="0" y1="24" x2="720" y2="24" />
            <line x1="0" y1="76" x2="720" y2="76" />
            <line x1="0" y1="128" x2="720" y2="128" />
            <line x1="0" y1="180" x2="720" y2="180" />
          </g>
          <line x1="480" y1="24" x2="480" y2="190" stroke="var(--red-line)" strokeWidth="2" strokeDasharray="4 5" />
          <path d="M0,160 L120,146 L240,116 L360,66 L480,38 L600,92 L720,124 L720,196 L0,196 Z" fill="var(--red)" opacity="0.08" />
          <path d="M0,160 L120,146 L240,116 L360,66 L480,38 L600,92 L720,124" fill="none" stroke="var(--red)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M0,178 L120,170 L240,154 L360,132 L480,110 L600,144 L720,164" fill="none" stroke="var(--g300)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 9" />
          <g fill="var(--red)">
            <circle cx="360" cy="66" r="5" />
            <circle cx="480" cy="38" r="7" stroke="#fff" strokeWidth="2.5" />
          </g>
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--g400)", fontWeight: 600, marginTop: 8 }}>
          <span>5/29</span>
          <span>5/31</span>
          <span>6/2</span>
          <span style={{ color: "var(--red)", fontWeight: 700 }}>6/3 선거일</span>
          <span>6/4</span>
          <span>6/5</span>
          <span>6/6</span>
        </div>
      </div>
      <div className="vizg">
        <div className="chartc">
          <div className="t">카테고리별 분포</div>
          <HBar l="B 집회·시위" v="156" w="100%" />
          <HBar l="A 선거" v="124" w="79%" />
          <HBar l="C 공익" v="38" w="24%" last />
        </div>
        <div className="chartc">
          <div className="t">지역별 분포 (상위)</div>
          <HBar l="서울" v="96" w="100%" />
          <HBar l="경기" v="64" w="67%" />
          <HBar l="부산" v="31" w="32%" last />
        </div>
      </div>
    </div>
  );
}

/* ── 4. 관리자 로그인 ───────────────────────────────────────────────── */
export function MockLogin() {
  return (
    <div className="login">
      <div className="login-card">
        <div className="lg">
          <span className="m">V</span>Votatis
        </div>
        <div className="sub">관리자 콘솔 · 검토자 전용</div>
        <div className="inp focus">admin@votatis.kr</div>
        <div className="inp" style={{ color: "var(--g500)" }}>비밀번호</div>
        <div className="lbtn">로그인</div>
        <div className="l2fa">
          접근 시 2단계 인증(OTP)이 요구됩니다.
          <br />
          모든 로그인·열람 활동은 감사 로그에 기록됩니다.
        </div>
      </div>
    </div>
  );
}

/* ── 5. 관리자 대시보드 ─────────────────────────────────────────────── */
export function MockAdminDashboard() {
  return (
    <div className="dash">
      <aside className="dside">
        <Side.Logo label="관리자" />
        <div className="ds-sec">운영</div>
        <div className="ds-item on"><IGrid />대시보드</div>
        <div className="ds-item"><IUsers />회원<span className="cnt">1,284</span></div>
        <div className="ds-item"><IList />제보<span className="cnt">318</span></div>
        <div className="ds-item"><ICheckSq />검토 큐<span className="cnt">64</span></div>
        <div className="ds-item"><IImage />원본 데이터</div>
        <div className="ds-sec">콘텐츠</div>
        <div className="ds-item"><IEdit />정보·공지</div>
      </aside>
      <div className="dmain">
        <div className="dh">
          <div>
            <h3>대시보드</h3>
            <div className="sub">제9회 지방선거 · 운영 현황</div>
          </div>
          <div className="seg">
            <b className="on">오늘</b>
            <b>주간</b>
            <b>전체</b>
          </div>
        </div>
        <div className="tiles">
          <Tile tone="pt-g" l="총 회원" v="1,284" t="▲ 37 오늘" dir="up" />
          <Tile tone="pt-rl" l="총 제보" v="318" t="▲ 24 오늘" dir="up" />
          <Tile tone="pt-red" l="검증 대기" v="64" t="검토 큐" dir="dn" />
          <Tile tone="pt-dk" l="원본 보관" v="512" t="R2·봉인" dir="dn" />
        </div>
        <div className="prow adm">
          <div className="panel">
            <div className="ph">최근 제보 <span className="more">전체 보기</span></div>
            <div className="tblw">
              <table className="tbl">
                <thead><tr><th>구분</th><th>제보</th><th>지역</th><th>상태</th></tr></thead>
                <tbody>
                  <Row cat="B" nm="집회 과잉 진압 제보" region="서울 중구" chip={["c-rev", "검토중"]} />
                  <Row cat="A" nm="투표지 수량 정정" region="성남 분당" chip={["c-cnf", "사실확인"]} />
                  <Row cat="B" nm="연행 기록·부상자" region="서울 종로" chip={["c-unv", "미검증"]} />
                  <Row cat="C" nm="공공시설 안전 미흡" region="대전 서구" chip={["c-rev", "검토중"]} />
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel">
            <div className="ph">카테고리별 제보</div>
            <HBar l="B 집회·시위" v="156" w="100%" />
            <HBar l="A 선거" v="124" w="79%" />
            <HBar l="C 공익" v="38" w="24%" mb={16} />
            <div className="rate">
              <div className="rl"><span>신규 가입 · 오늘</span><b>37명</b></div>
              <div className="track"><i style={{ width: "62%" }} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 6. 회원 관리 ───────────────────────────────────────────────────── */
export function MockMembers() {
  return (
    <div className="dash">
      <aside className="dside">
        <Side.Logo label="관리자" />
        <div className="ds-sec">운영</div>
        <div className="ds-item"><IGrid />대시보드</div>
        <div className="ds-item on"><IUsers />회원<span className="cnt">1,284</span></div>
        <div className="ds-item"><IList />제보</div>
        <div className="ds-item"><ICheckSq />검토 큐</div>
      </aside>
      <div className="dmain">
        <div className="dh">
          <div>
            <h3>회원 관리</h3>
            <div className="sub">총 1,284명 · 오늘 가입 37</div>
          </div>
          <div className="dsearch"><ISearch size={13} />익명 ID 검색</div>
        </div>
        <div className="prow adm">
          <div className="panel">
            <div className="ph">회원 목록 <span className="more">필터</span></div>
            <div className="tblw">
              <table className="tbl">
                <thead><tr><th>회원</th><th>가입</th><th>제보</th><th>인증</th><th>상태</th></tr></thead>
                <tbody>
                  <MemRow sel initial="민" id="anon-7c3" j="06.06" r="4" a="이메일" chip={["c-cor", "활성"]} />
                  <MemRow initial="정" id="anon-9a1" j="06.06" r="1" a="미인증" chip={["c-unv", "대기"]} />
                  <MemRow initial="박" id="anon-4e8" j="06.05" r="9" a="이메일" chip={["c-cor", "활성"]} />
                  <MemRow initial="김" id="anon-1b2" j="06.05" r="0" a="이메일" chip={["c-deb", "정지"]} />
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ph">회원 상세</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span className="av" style={{ width: 36, height: 36, fontSize: 14 }}>민</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>anon-7c3</div>
                <div style={{ fontSize: "11.5px", color: "var(--g500)" }}>민** · 이메일 인증</div>
              </div>
            </div>
            <div className="kv"><b>가입일</b> 2026.06.06</div>
            <div className="kv"><b>제보 수</b> 4건 (A 1 · B 3)</div>
            <div className="kv" style={{ marginBottom: 12 }}><b>상태</b> 활성</div>
            <div className="rsec">활동 로그</div>
            <div className="kv">B 집회·시위 제보 · 06.06<br />A 선거 제보 · 06.04</div>
            <div className="act">
              <div className="a2" style={{ flex: 1 }}>제보 보기</div>
              <div className="a1" style={{ flex: 1, background: "var(--g900)" }}>계정 정지</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 7. 검토 큐 ─────────────────────────────────────────────────────── */
export function MockQueue() {
  return (
    <div className="dash">
      <aside className="dside">
        <Side.Logo label="관리자" />
        <div className="ds-sec">검증</div>
        <div className="ds-item on"><ICheckSq />검토 큐<span className="cnt">64</span></div>
        <div className="ds-item"><IChart />통계</div>
        <div className="ds-item"><IImage />원본 데이터</div>
      </aside>
      <div className="dmain">
        <div className="dh">
          <div>
            <h3>검토 큐</h3>
            <div className="sub">검증 대기 64건 · 담당 3명</div>
          </div>
          <div className="seg">
            <b className="on">대기</b>
            <b>보완</b>
            <b>완료</b>
          </div>
        </div>
        <div className="tiles">
          <Tile tone="pt-rl" l="대기" v="64" t="검증 전" dir="dn" />
          <Tile tone="pt-red" l="오늘 승인" v="12" t="▲ 처리" dir="up" />
          <Tile tone="pt-g" l="평균 검토" v={<>3.2<span style={{ fontSize: 14 }}>h</span></>} t="소요" dir="dn" />
          <Tile tone="pt-dk" l="반박률" v={<>11<span style={{ fontSize: 14 }}>%</span></>} t="누적" dir="dn" />
        </div>
        <div className="prow adm">
          <div className="panel">
            <div className="ph">대기 항목 <span className="more">우선순위순</span></div>
            <div className="tblw">
              <table className="tbl">
                <thead><tr><th>구분</th><th>제보</th><th>유형</th><th>상태</th></tr></thead>
                <tbody>
                  <Row sel cat="B" nm="집회 과잉 진압 제보" region="과잉 진압" chip={["c-rev", "검토중"]} />
                  <Row cat="A" nm="투표지 인쇄 이상" region="훼손" chip={["c-unv", "미검증"]} />
                  <Row cat="B" nm="연행 현장·부상자" region="연행" chip={["c-rev", "검토중"]} />
                  <Row cat="C" nm="공공시설 안전 미흡" region="기타" chip={["c-unv", "미검증"]} />
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
            <div className="ph">검증 패널</div>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 5, letterSpacing: "-0.02em" }}>집회 과잉 진압 제보</div>
            <p style={{ fontSize: 12, color: "var(--g600)", lineHeight: 1.5, marginBottom: 13 }}>
              진압 과정 영상 제보. 원본·시각·위치 대조 진행중.
            </p>
            <div className="thumbs">
              <div className="t on"><IImage size={18} /></div>
              <div className="t"><IImage size={18} /></div>
            </div>
            <div className="kv" style={{ marginTop: 13 }}><b>검증 방법</b> 원본 영상 대조, 시각·위치 확인</div>
            <div className="kv" style={{ marginBottom: 6 }}><b>근거</b> 제보 첨부 2건 · 언론 보도</div>
            <div className="act">
              <div className="a1">승인</div>
              <div className="a2">보완</div>
              <div className="a3"><IX size={16} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 8. 원본 데이터 검수 ────────────────────────────────────────────── */
export function MockEvidence() {
  return (
    <div style={{ background: "var(--g50)", padding: "clamp(16px,3vw,24px)" }}>
      <div className="privacy">
        <IShield size={18} />
        <p>
          원본은 관리자만 열람하며 모든 접근이 기록됩니다. 공개 아카이브에는 얼굴·번호판이 자동 마스킹된 버전만 게시됩니다.
        </p>
      </div>
      <div className="prow" style={{ gridTemplateColumns: "1.4fr .6fr", gap: 14 }}>
        <div className="panel">
          <div className="ph">
            증거 원본 · IMG_0421.jpg
            <div className="seg" style={{ marginLeft: "auto" }}>
              <b className="on">원본</b>
              <b>마스킹</b>
            </div>
          </div>
          <div className="ev2">
            <IImage size={56} strokeWidth={1.4} style={{ color: "var(--g400)" }} />
            <div className="fbox" style={{ left: "18%", top: "30%", width: "18%", height: "34%" }} />
            <div className="ftag" style={{ left: "18%", top: "66%" }}>얼굴 마스킹 대상</div>
            <div className="fbox" style={{ right: "16%", top: "42%", width: "26%", height: "16%", borderStyle: "dashed", borderColor: "var(--g500)" }} />
            <div className="dim">4032 × 3024 · 5.1MB</div>
          </div>
          <div className="thumbs">
            <div className="t on"><IImage size={18} /></div>
            <div className="t"><IImage size={18} /></div>
            <div className="t" style={{ fontSize: 12, fontWeight: 700 }}>+2</div>
          </div>
        </div>
        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="ph">제보 · 메타데이터</div>
          <div style={{ marginBottom: 13 }}>
            <span className="catb cat-b" style={{ marginRight: 7 }}>B</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>집회·시위 · 연행 기록</span>
          </div>
          <div className="kv"><b>제보자</b> anon-7c3 (익명 ID)</div>
          <div className="kv"><b>촬영</b> 2026.06.06 16:20</div>
          <div className="kv"><b>기기</b> iPhone · EXIF 보존</div>
          <div className="kv"><b>GPS</b> 37.5662, 126.9779</div>
          <div className="kv" style={{ marginBottom: 11 }}><b>해상도</b> 4032 × 3024</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--g500)", background: "var(--g50)", border: "1px solid var(--g200)", borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
            sha256 · 3b1f0c…a7e2
          </div>
          <div className="rsec">접근 로그</div>
          <div className="kv">reviewer-a1 · 06.06 17:02<br />reviewer-c3 · 06.06 18:40</div>
          <div className="act">
            <div className="a1">승인</div>
            <div className="a2">보완</div>
            <div className="a3"><IX size={16} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 내부 헬퍼 ──────────────────────────────────────────────────────── */
function Tile({ tone, l, v, t, dir }: { tone: string; l: string; v: React.ReactNode; t: string; dir: string }) {
  return (
    <div className="tile">
      <div className="tl"><span className={`pt ${tone}`} />{l}</div>
      <div className="tv">{v}</div>
      <div className={`td ${dir}`}>{t}</div>
    </div>
  );
}
function Row({ cat, nm, region, chip, t, sel }: { cat: string; nm: string; region: string; chip: [string, string]; t?: string; sel?: boolean }) {
  return (
    <tr className={sel ? "sel" : undefined}>
      <td><span className={`catb cat-${cat.toLowerCase()}`}>{cat}</span></td>
      <td className="nm">{nm}</td>
      <td className="mut">{region}</td>
      <td><span className={`chip sm ${chip[0]}`}><span className="pt" />{chip[1]}</span></td>
      {t !== undefined && <td className="mut">{t}</td>}
    </tr>
  );
}
function MemRow({ initial, id, j, r, a, chip, sel }: { initial: string; id: string; j: string; r: string; a: string; chip: [string, string]; sel?: boolean }) {
  return (
    <tr className={sel ? "sel" : undefined}>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="av">{initial}</span>
          <span className="nm" style={{ maxWidth: "none" }}>{id}</span>
        </div>
      </td>
      <td className="mut">{j}</td>
      <td className="mut">{r}</td>
      <td className="mut">{a}</td>
      <td><span className={`chip sm ${chip[0]}`}><span className="pt" />{chip[1]}</span></td>
    </tr>
  );
}
function Leg({ c, l, v }: { c: string; l: string; v: string }) {
  return (
    <div className="lg">
      <span className="sw" style={{ background: c }} />
      {l}<span className="vv">{v}</span>
    </div>
  );
}
function HBar({ l, v, w, last, mb }: { l: string; v: string; w: string; last?: boolean; mb?: number }) {
  const style = last ? { marginBottom: 0 } : mb ? { marginBottom: mb } : undefined;
  return (
    <div className="hbar" style={style}>
      <div className="hl"><span>{l}</span><b>{v}</b></div>
      <div className="track"><i style={{ width: w }} /></div>
    </div>
  );
}
