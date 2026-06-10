/* 앱 목업 화면 본문 (app.html 1:1). DeviceFrame 안에 들어가는 콘텐츠. */
import { ICamera, IPin, IX, IImage, ICheck, IPlus, IBack, IGrid, ISearch, IList } from "./mock-icons";

/* A-00 온보딩 */
export function MockOnboarding() {
  return (
    <>
      <div className="onb">
        <div className="logo">V</div>
        <h2>현장의 증거를<br />출처와 함께</h2>
        <p>제보에는 위치와 카메라 권한이 필요합니다. 촬영 사진은 메타데이터를 보존해 검증에 사용됩니다.</p>
        <div className="perm">
          <div className="prow2">
            <div className="pic"><ICamera size={20} /></div>
            <div className="tx"><b>카메라</b><span>현장 사진·영상 촬영</span></div>
            <div className="sw" />
          </div>
          <div className="prow2">
            <div className="pic"><IPin size={20} /></div>
            <div className="tx"><b>위치</b><span>제보 지점 자동 입력</span></div>
            <div className="sw off" />
          </div>
        </div>
      </div>
      <div className="pfoot"><div className="pbtn">시작하기</div></div>
    </>
  );
}

/* A-01 제보 1 (카테고리·위치·유형) */
export function MockReport1() {
  return (
    <>
      <div className="phd">
        <div className="pg"><span>작성 완성도</span><b>40%</b></div>
        <div className="ppb"><i style={{ width: "40%" }} /></div>
        <div className="t">제보하기</div>
        <div className="s">검토 큐로 전송됩니다</div>
      </div>
      <div className="pcontent">
        <div className="pl">카테고리</div>
        <div className="pty"><b className="on">선거</b><b>집회·시위</b><b>공익</b></div>
        <div className="pl">위치</div>
        <div className="pi fill"><IPin size={16} />경기 · 성남시 분당구</div>
        <div className="pl">유형</div>
        <div className="pty"><b>수치 에러</b><b className="on">봉인</b><b>훼손</b><b>지연</b><b>기타</b></div>
      </div>
      <div className="pfoot"><div className="pbtn">다음</div></div>
    </>
  );
}

/* A-02 제보 2 (상세·출처) */
export function MockReport2() {
  return (
    <>
      <div className="phd">
        <div className="pg"><span>작성 완성도</span><b>65%</b></div>
        <div className="ppb"><i style={{ width: "65%" }} /></div>
        <div className="t">제보하기</div>
        <div className="s">보이는 사실을 중립적으로</div>
      </div>
      <div className="pcontent">
        <div className="pl">제목</div>
        <div className="pi fill">사전투표함 봉인 스티커 훼손</div>
        <div className="pl">상세 설명</div>
        <div className="parea">
          <p>오후 4시경 봉인 스티커 일부가 떨어진 상태로 보였습니다. 사진을 함께 첨부합니다.</p>
          <div className="cc">112 / 2000</div>
        </div>
        <div className="pl">출처</div>
        <div className="psr">
          <div className="si">https://news.example.com/…</div>
          <div className="sx"><IX size={14} /></div>
        </div>
        <div className="padd"><IPlus size={13} />출처 추가</div>
      </div>
      <div className="pfoot"><div className="pbtn">다음</div></div>
    </>
  );
}

/* A-03 제보 3 (첨부·동의) */
export function MockReport3() {
  return (
    <>
      <div className="phd">
        <div className="pg"><span>작성 완성도</span><b>90%</b></div>
        <div className="ppb"><i style={{ width: "90%" }} /></div>
        <div className="t">제보하기</div>
        <div className="s">메타데이터 보존 업로드</div>
      </div>
      <div className="pcontent">
        <div className="pl">첨부 자료</div>
        <div className="pup">
          <div className="ic"><ICamera size={22} /></div>
          <p>카메라로 촬영 · 사진 선택</p>
          <div className="sub">JPG·PNG·MP4 · 최대 50MB · 5개</div>
        </div>
        <div className="pth">
          <div className="t2"><IImage size={22} /><span className="ex">EXIF</span></div>
          <div className="t2"><IImage size={22} /><span className="ex">EXIF</span></div>
        </div>
        <div className="popt">메타데이터 확인됨 · 최적화 시 약 -74%</div>
        <div className="pck">
          <div className="b"><ICheck size={13} strokeWidth={3} /></div>
          <p><b style={{ color: "var(--g900)" }}>익명 제보·공개 동의</b> 실명·연락처는 저장하지 않습니다.</p>
        </div>
      </div>
      <div className="pfoot"><div className="pbtn">제보 보내기</div></div>
    </>
  );
}

/* A-04 완료 */
export function MockSuccess() {
  return (
    <>
      <div className="psuc">
        <div className="sc"><ICheck size={38} /></div>
        <h4>제보가 접수되었습니다</h4>
        <p>검토 큐에 등록되었습니다. 사람이 출처를 대조한 뒤 공개 여부가 결정됩니다.</p>
        <span className="ref">접수번호 local9-2026-4827</span>
        <div className="pp">
          <b style={{ color: "var(--g700)" }}>이후 처리</b><br />
          1. R2 업로드 · SHA-256 봉인<br />
          2. 검토 큐 등록<br />
          3. 검증 후 공개 반영
        </div>
      </div>
      <div className="pfoot"><div className="pbtn ghost">아카이브 둘러보기</div></div>
    </>
  );
}

/* A-0B 집회·시위 변형 */
export function MockReportB() {
  return (
    <>
      <div className="phd">
        <div className="pg"><span>작성 완성도</span><b>45%</b></div>
        <div className="ppb"><i style={{ width: "45%" }} /></div>
        <div className="t">제보하기</div>
        <div className="s">집회·시위 현장 기록</div>
      </div>
      <div className="pcontent">
        <div className="pl">카테고리</div>
        <div className="pty"><b>선거</b><b className="on">집회·시위</b><b>공익</b></div>
        <div className="pl">위치</div>
        <div className="pi fill"><IPin size={16} />서울 중구 · 시청 앞</div>
        <div className="pl">유형</div>
        <div className="pty">
          <b className="on">과잉 진압</b><b>연행 기록</b><b>부상자</b><b>구호 물품</b><b>집회 통제</b><b>규모·밀집도</b><b>이상 신고</b>
        </div>
      </div>
      <div className="pfoot"><div className="pbtn">다음</div></div>
    </>
  );
}

/* A-05 아카이브 목록 */
export function MockAppList() {
  return (
    <>
      <div className="phd bar">
        <div>
          <div className="t">공개 아카이브</div>
          <div className="s">제9회 지방선거 · 318건</div>
        </div>
      </div>
      <div className="pcontent">
        <div className="mfil"><b className="on">전체</b><b>사실확인</b><b>반박됨</b><b>검토중</b></div>
        <MRec cat="A" nm="투표지 수량 보고 정정 확인" chip={["c-cnf", "사실확인"]} mm="성남 분당 · 출처 3 · 2h" />
        <MRec cat="B" nm="집회 현장 과잉 진압 제보" chip={["c-rev", "검토중"]} mm="서울 중구 · 출처 2 · 3h" />
        <MRec cat="A" nm="사전투표 용지 부족 주장" chip={["c-deb", "반박됨"]} mm="인천 연수 · 출처 2 · 1d" />
        <MRec cat="C" nm="공공시설 안전 미흡 제보" chip={["c-dis", "이견있음"]} mm="대전 서구 · 출처 1 · 2d" />
      </div>
      <div className="ptab">
        <div className="tb on"><IGrid size={20} />아카이브</div>
        <div className="tb"><ISearch size={20} />검색</div>
        <div className="tb"><IPlus size={20} />제보</div>
      </div>
    </>
  );
}

/* A-06 레코드 상세 */
export function MockAppDetail() {
  return (
    <>
      <div className="phd bar">
        <IBack size={22} style={{ color: "var(--g700)" }} />
        <div className="t" style={{ fontSize: 18 }}>레코드 상세</div>
      </div>
      <div className="pcontent">
        <span className="chip c-cnf"><span className="pt" />사실확인 · confirmed</span>
        <div className="md-meta">
          <span className="catb cat-a" style={{ width: "auto", padding: "0 8px", lineHeight: "25px", height: 25 }}>A 선거</span>
          <span>성남 분당구</span>
          <span>2026.06.03</span>
        </div>
        <h4 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.35, marginBottom: 9 }}>
          투표지 수량 보고 정정 사실 확인
        </h4>
        <p style={{ fontSize: 14, color: "var(--g600)", lineHeight: 1.6, marginBottom: 16 }}>
          1차 집계 보고 수치가 정정 공지로 수정된 사실 확인. 수치 적정성은 별도 판단.
        </p>
        <div className="rsec">출처 · 교차확인</div>
        <div className="rsrc">· 중앙선관위 정정 공지</div>
        <div className="rsrc">· 현장 영상 원본 대조</div>
        <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--g500)", background: "var(--g50)", border: "1px solid var(--g200)", borderRadius: 10, padding: "10px 12px", marginTop: 10 }}>
          sha256 · 9f86d0…2c4e7d
        </div>
      </div>
    </>
  );
}

/* A-07 검색·필터 */
export function MockAppSearch() {
  return (
    <>
      <div className="phd bar">
        <div className="pi foc" style={{ flex: 1, margin: 0 }}>
          <ISearch size={16} strokeWidth={2.2} />봉인 스티커
        </div>
      </div>
      <div className="pcontent">
        <div className="pl">카테고리</div>
        <div className="pty"><b className="on">전체</b><b>A 선거</b><b>B 집회·시위</b><b>C 공익</b></div>
        <div className="pl">검증 상태</div>
        <div className="pty"><b className="on">전체</b><b>사실확인</b><b>검토중</b><b>반박됨</b></div>
        <div className="pl">지역</div>
        <div className="pi fill"><IPin size={16} />전체 지역</div>
        <div className="pl">결과 · 12건</div>
        <div className="mrec" style={{ paddingTop: 6 }}>
          <div className="mt"><span className="catb cat-a">A</span><div className="mn">사전투표함 봉인 스티커 훼손</div></div>
          <div className="mm"><span className="chip sm c-rev"><span className="pt" />검토중</span> 성남 분당</div>
        </div>
      </div>
      <div className="pfoot"><div className="pbtn">결과 보기</div></div>
    </>
  );
}

function MRec({ cat, nm, chip, mm }: { cat: string; nm: string; chip: [string, string]; mm: string }) {
  return (
    <div className="mrec">
      <div className="mt">
        <span className={`catb cat-${cat.toLowerCase()}`}>{cat}</span>
        <div className="mn">{nm}</div>
        <span className={`chip sm ${chip[0]}`}><span className="pt" />{chip[1]}</span>
      </div>
      <div className="mm">{mm}</div>
    </div>
  );
}
