import type { ReactNode } from "react";
import { WinFrame, DeviceFrame } from "./frames";
import * as Web from "./web-screens";
import * as App from "./app-screens";

export interface MockScreen {
  slug: string;
  kind: "web" | "app";
  group: "public" | "admin" | "entry" | "browse";
  name: string;
  /** 윈도우 프레임 URL (web) / 스텝 코드 (app) */
  meta: string;
  tag?: string;
  realPath?: string; // 대응하는 실동작 라우트
  notes: { h: string; p: string }[];
  render: () => ReactNode;
}

export const SCREENS: MockScreen[] = [
  // ── WEB · 공개 ──
  {
    slug: "archive",
    kind: "web",
    group: "public",
    name: "공개 아카이브 · 목록·대시보드",
    meta: "votatis.kr/archive",
    realPath: "/archive",
    notes: [
      { h: "구성", p: "좌측 카테고리·상태 필터, 통계 타일 4, 카테고리 태그 기록 테이블, 상태 분포 도넛·처리율" },
      { h: "반응형", p: "사이드바 820px↓ 숨김, 타일 auto-fit, 패널 760px↓ 1열, 테이블 카드 내부 스크롤" },
    ],
    render: () => (
      <WinFrame url="votatis.kr/archive">
        <Web.MockArchive />
      </WinFrame>
    ),
  },
  {
    slug: "detail",
    kind: "web",
    group: "public",
    name: "레코드 상세",
    meta: "votatis.kr/archive/:id",
    realPath: "/archive/local9-2026-0042",
    notes: [
      { h: "구성", p: "상태 칩 · 카테고리·메타 · 출처/반론 2열 · 무결성 해시 · 검증 이력 타임라인" },
      { h: "원칙", p: "주장과 사실 라벨 분리, 반론 칸 비우지 않음, 출처 없으면 레코드 미존재" },
    ],
    render: () => (
      <WinFrame url="votatis.kr/archive/local9-2026-0042">
        <Web.MockDetail />
      </WinFrame>
    ),
  },
  {
    slug: "stats",
    kind: "web",
    group: "public",
    name: "통계 · 데이터",
    meta: "votatis.kr/stats",
    realPath: "/stats",
    notes: [
      { h: "시각화", p: "SVG viewBox로 폭 100% 신축, 외부 라이브러리 없음. 막대 2열은 680px↓ 1열" },
      { h: "집계", p: "카테고리·검증 상태별 구분 집계. 반박·정정 건도 분리 노출" },
    ],
    render: () => (
      <WinFrame url="votatis.kr/stats">
        <Web.MockStats />
      </WinFrame>
    ),
  },
  // ── WEB · 관리자 ──
  {
    slug: "admin-login",
    kind: "web",
    group: "admin",
    name: "관리자 로그인",
    meta: "admin.votatis.kr/login",
    tag: "2FA",
    realPath: "/free/admin/login",
    notes: [
      { h: "접근 제어", p: "관리자 계정만 접근, 2FA 필수. 제보자·열람자는 진입 불가" },
      { h: "보안", p: "HTTPS/TLS 1.3, Rate limit, 로그인 시도·세션 감사" },
    ],
    render: () => (
      <WinFrame url="admin.votatis.kr/login">
        <Web.MockLogin />
      </WinFrame>
    ),
  },
  {
    slug: "admin-dashboard",
    kind: "web",
    group: "admin",
    name: "관리자 대시보드 · 회원/제보/정보",
    meta: "admin.votatis.kr/dashboard",
    realPath: "/free/admin/dashboard",
    notes: [
      { h: "관리 범위", p: "회원가입·인증 확인, 제보·정보·공지 관리, 검토 큐 진입, 원본 데이터 접근" },
      { h: "권한", p: "관리자 전용. 실명 미저장·익명 ID 표기. 민감 작업 감사 로그" },
    ],
    render: () => (
      <WinFrame url="admin.votatis.kr/dashboard">
        <Web.MockAdminDashboard />
      </WinFrame>
    ),
  },
  {
    slug: "admin-members",
    kind: "web",
    group: "admin",
    name: "회원 관리 · 목록·상세",
    meta: "admin.votatis.kr/members",
    realPath: "/free/admin/members",
    notes: [
      { h: "구성", p: "회원 목록(가입·제보수·인증·상태) + 선택 시 상세 패널(활동 로그·제재)" },
      { h: "개인정보", p: "실명·연락처 비저장. 익명 ID 기준 관리. 정지·삭제는 감사 로그 기록" },
    ],
    render: () => (
      <WinFrame url="admin.votatis.kr/members">
        <Web.MockMembers />
      </WinFrame>
    ),
  },
  {
    slug: "admin-queue",
    kind: "web",
    group: "admin",
    name: "검토 큐 · 검증 패널",
    meta: "admin.votatis.kr/queue",
    realPath: "/free/admin/queue",
    notes: [
      { h: "상호작용", p: "행 선택 → 패널 로드. 승인/보완/거절은 근거 입력 후 상태 부여. 보완은 재검토 큐로" },
      { h: "연동", p: "GitHub Issue = 검토 큐. 승인 시 승격 스크립트가 공개 레포 커밋" },
    ],
    render: () => (
      <WinFrame url="admin.votatis.kr/queue">
        <Web.MockQueue />
      </WinFrame>
    ),
  },
  {
    slug: "admin-evidence",
    kind: "web",
    group: "admin",
    name: "원본 데이터 검수 · 공익 감시",
    meta: "admin.votatis.kr/evidence",
    tag: "감사 로그",
    realPath: "/free/admin/evidence/0153",
    notes: [
      { h: "프라이버시", p: "관리자만 원본 열람, 공개본 자동 마스킹. 부상자·연행 등 민감 제보 최소 노출 우선" },
      { h: "감사", p: "모든 원본 열람·다운로드 기록. 무결성 해시로 변조 검증" },
    ],
    render: () => (
      <WinFrame url="admin.votatis.kr/evidence/0153">
        <Web.MockEvidence />
      </WinFrame>
    ),
  },
  // ── APP · 진입/제보 ──
  {
    slug: "app-onboarding",
    kind: "app",
    group: "entry",
    name: "온보딩 · 권한 요청",
    meta: "A-00",
    realPath: "/report",
    notes: [{ h: "권한", p: "카메라·위치는 제보 시점에만 사용. 실명·연락처는 수집하지 않음" }],
    render: () => (
      <DeviceFrame>
        <App.MockOnboarding />
      </DeviceFrame>
    ),
  },
  {
    slug: "app-report-1",
    kind: "app",
    group: "entry",
    name: "제보 1 · 카테고리·위치·유형",
    meta: "A-01",
    realPath: "/report",
    notes: [{ h: "동작", p: "카테고리 선택 시 유형 세트 전환. 위치는 GPS 자동·수동 보정" }],
    render: () => (
      <DeviceFrame>
        <App.MockReport1 />
      </DeviceFrame>
    ),
  },
  {
    slug: "app-report-2",
    kind: "app",
    group: "entry",
    name: "제보 2 · 상세·출처",
    meta: "A-02",
    realPath: "/report",
    notes: [{ h: "원칙", p: "중립 서술 안내. 출처 링크 또는 직접 촬영 첨부 중 최소 1개 필수" }],
    render: () => (
      <DeviceFrame>
        <App.MockReport2 />
      </DeviceFrame>
    ),
  },
  {
    slug: "app-report-3",
    kind: "app",
    group: "entry",
    name: "제보 3 · 첨부·동의",
    meta: "A-03",
    realPath: "/report",
    notes: [{ h: "검증", p: "확장자·MIME·용량 검사, JPEG EXIF 점검, 1920px·WebP 최적화 추정 표시" }],
    render: () => (
      <DeviceFrame>
        <App.MockReport3 />
      </DeviceFrame>
    ),
  },
  {
    slug: "app-success",
    kind: "app",
    group: "entry",
    name: "제보 완료",
    meta: "A-04",
    realPath: "/report",
    notes: [{ h: "안내", p: "접수번호 부여. 제보는 주장으로 접수되어 검증 절차를 거친다는 점 재고지" }],
    render: () => (
      <DeviceFrame>
        <App.MockSuccess />
      </DeviceFrame>
    ),
  },
  {
    slug: "app-report-b",
    kind: "app",
    group: "entry",
    name: "집회·시위 제보 (B)",
    meta: "A-0B",
    tag: "카테고리 변형",
    realPath: "/report",
    notes: [{ h: "카테고리 B", p: "유형이 집회·시위 세트로 전환. 부상자·연행 제보는 민감 정보로 분류, 공개 시 자동 마스킹" }],
    render: () => (
      <DeviceFrame>
        <App.MockReportB />
      </DeviceFrame>
    ),
  },
  // ── APP · 열람 ──
  {
    slug: "app-list",
    kind: "app",
    group: "browse",
    name: "아카이브 목록",
    meta: "A-05",
    realPath: "/archive",
    notes: [{ h: "동작", p: "상태 필터 칩 · 카테고리 배지 · 무한 스크롤 · 하단 탭바. 행 탭 시 상세" }],
    render: () => (
      <DeviceFrame>
        <App.MockAppList />
      </DeviceFrame>
    ),
  },
  {
    slug: "app-detail",
    kind: "app",
    group: "browse",
    name: "레코드 상세",
    meta: "A-06",
    realPath: "/archive/local9-2026-0042",
    notes: [{ h: "요소", p: "상태 칩 · 카테고리·메타 · 출처 · 무결성 해시. 웹과 동일 스키마, 단일 컬럼" }],
    render: () => (
      <DeviceFrame>
        <App.MockAppDetail />
      </DeviceFrame>
    ),
  },
  {
    slug: "app-search",
    kind: "app",
    group: "browse",
    name: "검색 · 필터",
    meta: "A-07",
    realPath: "/search",
    notes: [{ h: "검색", p: "키워드 + 카테고리·상태·지역 필터 조합. v2에서 시맨틱 검색 연동" }],
    render: () => (
      <DeviceFrame>
        <App.MockAppSearch />
      </DeviceFrame>
    ),
  },
];

export const SCREEN_MAP = Object.fromEntries(SCREENS.map((s) => [s.slug, s]));
