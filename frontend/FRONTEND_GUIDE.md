# Votatis 프론트엔드 구성 가이드

시민 주도 선거·집회·공익 제보 검증 아카이브의 프론트엔드. 흩어진 제보를 출처와 함께 모으고, 사람이 검증한 결과만 검증 상태 라벨과 함께 공개한다.

---

## 1. 기술 스택

| 항목 | 선택 |
|---|---|
| 프레임워크 | Next.js 16.2.7 (App Router, Turbopack) |
| 언어 | TypeScript |
| 스타일 | Tailwind v4 + 디자인 토큰(CSS 변수) + 컴포넌트 CSS |
| 폰트 | Pretendard Variable (CDN) |
| 경로 alias | `@/*` → `src/*` |
| 차트 | 외부 라이브러리 없음 (인라인 SVG) |

설치·실행:

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
```

---

## 2. 화면 분류 — 두 트랙

화면은 목적에 따라 **목업**과 **실동작** 두 트랙으로 나뉜다.

### 목업 화면 (mock 데이터 채운 완성본)
- 디자인 가이드(`screen_guide/web.html`, `screen_guide/app.html`)를 1:1 이식.
- mock 데이터로 모든 영역이 채워져 **완성 디자인을 그대로 확인**하는 용도.
- 위치: `/free/preview`(전체 한곳) + `/free/mock/<slug>`(개별).

### 실동작 화면 (mock 데이터 없음 + 실인터랙션)
- 빈 상태(empty state)를 기본으로, **필터·정렬·탭·다단계 폼 등 인터랙션이 실제로 작동**.
- 데이터 fetch 지점은 코드에 `// TODO` 주석으로 표시 → 추후 백엔드 연동.
- 위치: `/archive`, `/stats`, `/search`, `/report`, `/free/admin/*`.

---

## 3. 전체 화면 경로

### 3.1 공개 (실동작 · 로그인 불필요)

| 경로 | 화면 | 동작 | 렌더 |
|---|---|---|---|
| `/` | 랜딩 | 스크롤 reveal, 쇼케이스 목업 3종 | Static |
| `/archive` | 공개 아카이브 목록·대시보드 | 카테고리·검증상태 필터칩, 전체/최신 정렬 토글 (빈 상태) | Static |
| `/archive/[id]` | 레코드 상세 | 식별자별 레코드(없음 상태) | Dynamic |
| `/stats` | 통계 | 일자별 추이·카테고리·상태 분포 (0 집계) | Static |
| `/search` | 검색·필터 | 키워드 입력 + 카테고리·검증상태 필터, 결과 보기 | Static |
| `/report` | 제보 다단계 폼 | 온보딩→1→2→3→완료, 카테고리별 유형 전환 | Static |

### 3.2 관리자 콘솔 (실동작 · `/free/admin/*`)

> 가이드의 `admin.votatis.kr` 서브도메인을 단일 앱 내 `/free/admin` prefix로 매핑.

| 경로 | 화면 | 동작 |
|---|---|---|
| `/free/admin` | (리다이렉트) | → `/free/admin/login` |
| `/free/admin/login` | 관리자 로그인 | 이메일·비밀번호 입력 검증 → 대시보드 이동 (2FA·세션은 TODO) |
| `/free/admin/dashboard` | 대시보드 | 회원·제보·검증대기·원본 타일 (0), 카테고리 막대 |
| `/free/admin/members` | 회원 관리 | 익명 ID 목록·상세 패널 (빈 상태) |
| `/free/admin/queue` | 검토 큐·검증 패널 | 대기/보완/완료 탭 토글, 행 선택→패널 (빈 큐) |
| `/free/admin/evidence/[id]` | 원본 데이터 검수 | 원본/마스킹 토글, 메타데이터·접근 로그 (없음 상태) |

### 3.3 목업 갤러리 (`/free/preview`, `/free/mock/*`)

| 경로 | 내용 |
|---|---|
| `/free/preview` | 웹 8 + 앱 9 = **17개 화면**을 윈도우·디바이스 프레임 안에 모아 표시 (가이드와 동일 레이아웃) |
| `/free/mock/[screen]` | 개별 화면 풀스크린. 슬러그는 아래 표 |

**웹 목업 슬러그** (`/free/mock/<slug>`)

| slug | 화면 | 대응 실동작 |
|---|---|---|
| `archive` | 공개 아카이브 목록·대시보드 | `/archive` |
| `detail` | 레코드 상세 | `/archive/local9-2026-0042` |
| `stats` | 통계 | `/stats` |
| `admin-login` | 관리자 로그인 | `/free/admin/login` |
| `admin-dashboard` | 관리자 대시보드 | `/free/admin/dashboard` |
| `admin-members` | 회원 관리 | `/free/admin/members` |
| `admin-queue` | 검토 큐 | `/free/admin/queue` |
| `admin-evidence` | 원본 데이터 검수 | `/free/admin/evidence/0153` |

**앱 목업 슬러그** (iPhone 390×844 프레임)

| slug | 스텝 | 화면 |
|---|---|---|
| `app-onboarding` | A-00 | 온보딩·권한 요청 |
| `app-report-1` | A-01 | 제보 1 · 카테고리·위치·유형 |
| `app-report-2` | A-02 | 제보 2 · 상세·출처 |
| `app-report-3` | A-03 | 제보 3 · 첨부·동의 |
| `app-success` | A-04 | 제보 완료 |
| `app-report-b` | A-0B | 집회·시위 제보 변형 |
| `app-list` | A-05 | 아카이브 목록 |
| `app-detail` | A-06 | 레코드 상세 |
| `app-search` | A-07 | 검색·필터 |

---

## 4. 디렉토리 구조

```
frontend/
├─ src/
│  ├─ app/                          # App Router 라우트
│  │  ├─ layout.tsx                 # 루트(lang=ko, Pretendard CDN, 메타)
│  │  ├─ page.tsx                   # 랜딩
│  │  ├─ globals.css                # 디자인 토큰(:root) + Tailwind @theme 매핑
│  │  ├─ landing.css                # 랜딩 전용 스타일
│  │  ├─ app-shell.css              # 웹/앱 공용(nav·btn·dash·tile·panel·tbl·donut·login·empty…)
│  │  ├─ archive/
│  │  │  ├─ page.tsx                # 서버: 헤더+셸
│  │  │  ├─ ArchiveClient.tsx       # 클라: 필터·정렬 인터랙션
│  │  │  └─ [id]/page.tsx           # 레코드 상세(Dynamic)
│  │  ├─ stats/page.tsx
│  │  ├─ search/{page,SearchClient}.tsx
│  │  ├─ report/
│  │  │  ├─ page.tsx
│  │  │  ├─ ReportFlow.tsx          # 클라: 다단계 폼 상태머신
│  │  │  └─ report.css              # 폼 전용 스타일
│  │  └─ free/
│  │     ├─ mock.css                # 목업 프레임(.win/.device)·앱 화면 내부 스타일
│  │     ├─ preview/page.tsx        # 목업 갤러리
│  │     ├─ mock/[screen]/page.tsx  # 목업 개별(generateStaticParams)
│  │     └─ admin/
│  │        ├─ layout.tsx           # 콘솔 공용 셸(상단바+캔버스)
│  │        ├─ page.tsx             # → login 리다이렉트
│  │        ├─ login/{page,LoginForm}.tsx
│  │        ├─ dashboard/page.tsx
│  │        ├─ members/page.tsx
│  │        ├─ queue/{page,QueueClient}.tsx
│  │        └─ evidence/[id]/page.tsx
│  │
│  ├─ components/
│  │  ├─ layout/
│  │  │  ├─ Header.tsx              # 랜딩 헤더(앵커 내비)
│  │  │  ├─ SiteHeader.tsx          # 공개 페이지 헤더(라우트 내비)
│  │  │  └─ Footer.tsx
│  │  ├─ landing/                   # Hero·Problem·ShowcaseArchive/Admin/Mobile·
│  │  │                             #  DataViz·Pipeline·Principles·Cta·Reveal·icons
│  │  ├─ ui/index.tsx               # Chip·CatBadge·Tile·Track·HBar·Donut
│  │  ├─ web/AdminShell.tsx         # 관리자 사이드바 셸
│  │  └─ mock/                      # 목업 전용
│  │     ├─ mock-icons.tsx          # 가이드 SVG 아이콘 + 모바일 StatusBar
│  │     ├─ frames.tsx              # WinFrame·DeviceFrame·ScreenCap·PhoneCap·Notes
│  │     ├─ web-screens.tsx         # 웹 8화면 본문
│  │     ├─ app-screens.tsx         # 앱 9화면 본문
│  │     └─ registry.tsx            # 화면 메타 레지스트리(preview·개별 공유)
│  │
│  └─ lib/
│     ├─ types.ts                   # 도메인 타입·라벨·매핑(아래 5장)
│     └─ mock/{records,admin}.ts    # 목업 전용 데이터
```

---

## 5. 도메인 모델 (`src/lib/types.ts`)

### 카테고리

| 코드 | 라벨 | 색 |
|---|---|---|
| `A` | 선거 | red |
| `B` | 집회·시위 | g900 |
| `C` | 공익 | g500 |

카테고리별 제보 유형(`TYPE_SETS`):
- **A**: 수치 에러 · 봉인 · 훼손 · 지연 · 기타
- **B**: 과잉 진압 · 연행 기록 · 부상자 · 구호 물품 · 집회 통제 · 규모·밀집도 · 이상 신고
- **C**: 부패 · 안전 · 환경 · 기타

### 검증 상태 (6단계)

| 값 | 라벨 | 칩 클래스 |
|---|---|---|
| `confirmed` | 사실확인 | `c-cnf` |
| `reviewing` | 검토중 | `c-rev` |
| `unverified` | 미검증 | `c-unv` |
| `disputed` | 이견있음 | `c-dis` |
| `debunked` | 반박됨 | `c-deb` |
| `corrected` | 정정됨 | `c-cor` |

---

## 6. 디자인 토큰

`globals.css`의 `:root`에 정의, Tailwind v4 `@theme`에 매핑(클래스로 `bg-red`, `text-g700` 등 사용 가능).

- **Red**: `--red #dc2626` · `--red-strong` · `--red-bg` · `--red-line` · `--red-300`
- **Gray**: `--g900`~`--g50`, `--bg #fff`
- **반경**: `--r-lg/md/sm`  **그림자**: `--sh-sm/sh/sh-lg/sh-xl`
- **폰트**: `--font`(Pretendard) · `--mono`

스타일 분리 원칙:
- 디자인 가이드 1:1 이식부(.dash/.win/.device 등 복잡 레이아웃)는 컴포넌트 CSS로 보존.
- 신규 작업·반응형 미세조정은 Tailwind 유틸리티 사용.

---

## 7. 제보 플로우 (`/report`)

상태머신: `onb → s1 → s2 → s3 → done` (`ReportFlow.tsx`)

1. **온보딩(onb)** — 카메라·위치 권한 토글
2. **s1** — 카테고리(A/B/C) 선택 시 유형 세트 자동 전환, 위치, 유형 (유형 선택 필수)
3. **s2** — 제목(필수)·상세(2000자)·출처(추가/삭제)
4. **s3** — 첨부 업로드·익명 공개 동의 체크(필수)
5. **done** — 접수번호 표시, 아카이브 이동

진행바·검증·뒤로가기 작동. 제출 시 `POST /api/reports`는 TODO.

---

## 8. 백엔드 연동 지점 (TODO)

코드 내 `// TODO` 위치:

| 화면 | 엔드포인트(예정) |
|---|---|
| 아카이브 목록 | `GET /api/records?category&status&sort` |
| 레코드 상세 | `GET /api/records/{id}` |
| 통계 | `GET /api/stats` |
| 검색 | `GET /api/search?q&category&status` |
| 제보 제출 | `POST /api/reports` (R2 업로드·SHA-256 봉인) |
| 관리자 로그인 | `POST /api/admin/login` (OTP 2FA·세션) |
| 관리자 대시보드 | `GET /api/admin/overview` |
| 회원 관리 | `GET /api/admin/members` |
| 검토 큐 | `GET /api/admin/queue?tab` |
| 원본 검수 | `GET /api/admin/evidence/{id}` (열람 감사 로그) |

---

## 9. 빌드 현황

- 총 라우트 34개 (목업 17 SSG 포함)
- `npm run build` 통과, TypeScript 클린
- `node_modules`·`.next` 미커밋
```
Static  (○)  : 대부분의 공개·관리자·목업 화면
SSG     (●)  : /free/mock/[screen]
Dynamic (ƒ)  : /archive/[id], /free/admin/evidence/[id]
```
