---
id: "0005"
title: 랜딩 페이지 + 제보 페이지 분리
status: completed
created: 2026-06-10
updated: 2026-06-10
related:
  - "votatis.html (디자인 시안 — 자체 CSS 랜딩)"
  - "specs/completed/0003-report-web-app.md (apps/web 정적 빌드)"
  - "specs/completed/0004-report-flow-wizard.md (ReportWizard)"
  - "docs/MVP-PRD.md §11 웹 기획"
  - "https://docs.astro.build/en/basics/astro-pages/"
---

# 랜딩 페이지 + 제보 페이지 분리

## 1. 배경 / 문제

현재 `apps/web`의 `/`(index)는 곧장 제보 마법사(`ReportWizard`)다. 하지만 프로젝트 소개·신뢰(검증 우선 원칙)·아카이브를 보여줄 **랜딩 페이지**가 첫 화면이어야 한다. 디자인 시안 `votatis.html`(Pretendard + 자체 CSS, 레드 시그널)이 헤더/히어로/공개 아카이브/검증 시스템/통계/최종 CTA/푸터 구성을 갖추고 있다.

이 시안을 `/` 랜딩으로 이식하고, **제보 마법사는 별도 페이지(`/report`)로 옮겨** 랜딩의 "제보하기/제보 보내기" 버튼이 그곳으로 이동하게 한다. 제출 흐름·intake-api 연동은 `0004` 그대로 재사용한다(로직 변경 없음, 위치만 이동).

## 2. 목표 (Goals)

- `votatis.html` 디자인을 `/`(index) 랜딩 페이지로 이식한다(전 섹션, 데모 수치는 "데모용 예시" 라벨 유지).
- 제보 마법사(`ReportWizard`)를 `/report` 페이지로 옮긴다.
- 랜딩의 모든 "제보하기/제보 보내기" 진입점이 `/report`로 이동한다.
- 두 라우트 모두 기존처럼 **정적 빌드**(Astro static)된다.

## 3. 비목표 (Non-Goals)

- 아카이브·통계의 **실데이터 연동**. 랜딩의 표·차트·수치는 `votatis.html`의 **데모 값 그대로**(시안에 명시된 "데모용 예시"). 실데이터는 공개 사이트/검색 스펙에서 다룬다.
- 공개 레코드 탐색·검색 페이지 구현(별도 스펙).
- 백엔드(intake-api) 변경. 제보 제출 로직은 `0004` 재사용.
- 다국어, 다크모드, SEO 고도화.

## 4. 요구사항

### 기능
1. **랜딩 `/`** — `votatis.html`의 섹션을 모두 이식: 헤더(브랜드+nav+제보 버튼), 히어로(제목/설명/CTA 2개), 공개 아카이브(`#archive`, 데모 표·통계), 검증 시스템(`#verify`), 통계(`#stats`, 데모 차트/막대), 최종 CTA(`#cta`), 푸터(링크 + 고지문). 데모 수치·기록은 시안 그대로 두고 푸터 고지("화면의 수치와 기록은 데모용 예시입니다")를 유지한다.
2. **제보 페이지 `/report`** — 기존 `index.astro`의 제보 마법사(`ReportWizard client:load`)를 이 경로로 옮긴다. 마법사 동작은 그대로(`0004`).
3. **제보 진입점 → `/report`** — 헤더 "제보하기", 히어로 "제보 보내기", 최종 CTA "제보 보내기", 푸터 "제보하기"가 모두 `/report`로 이동한다(현재 `#cta` 앵커 대체). 링크는 base path를 반영(`import.meta.env.BASE_URL`)해 GitHub Pages 서브경로에서도 안전.
4. **랜딩 내 앵커 내비** — `#archive`/`#verify`/`#stats` 등 섹션 점프는 랜딩 내부 스크롤로 유지. 아직 대상이 없는 외부 링크(GitHub·검증 큐·데이터 포맷 등)는 placeholder(`#`)로 둔다.
5. **바닐라 JS 유지** — 햄버거 메뉴, 스크롤 reveal, 막대(`data-w`) 채우기 등 시안의 소량 인라인 스크립트를 그대로 유지한다(React island 아님).

### 비기능
6. **스타일링** — (구현 결정) 시안이 디자인 토큰·conic-gradient 도넛·SVG 차트·복잡 그리드까지 응집된 자체 시스템이라, 하이브리드(부분 Tailwind)보다 **충실도·속도** 면에서 시안 CSS를 그대로 유지하는 편이 나아 **랜딩을 독립 문서(`index.astro`가 자체 `<html>`)로 두고 시안 `<style>`를 페이지 global 로 이식**했다. Tailwind/`Base.astro`를 쓰지 않아 preflight 충돌도 원천 차단. `/report`는 기존 Tailwind+`Base.astro` 유지. **Pretendard** 폰트는 시안대로 로드.
7. **정적 빌드** — `/`와 `/report` 모두 `dist/`에 정적 HTML로 생성. 랜딩 콘텐츠는 소량 바닐라 JS만, `/report`는 마법사 island JS만 싣는다.
8. **Tailwind reset 충돌 회피** — 랜딩에 시안 CSS를 섞을 때 Tailwind preflight와 시안 자체 reset이 충돌하지 않도록 scoped style·우선순위를 정리한다.

### 기술 스택
- 기존 `apps/web` Astro. 라우트는 `src/pages/index.astro`(랜딩), `src/pages/report.astro`(마법사).
- 재사용: `ReportWizard.tsx`, `Base.astro`(또는 report 전용 레이아웃), `lib/*`.

## 5. 설계 개요

### 라우트/파일
```
apps/web/src/
  pages/
    index.astro    # 랜딩 (votatis.html 이식)  ← 기존 마법사 내용 제거
    report.astro   # 제보 마법사 (ReportWizard client:load)  ← 기존 index 내용 이동
    404.astro
  components/
    landing/*.astro  # (선택) 섹션별 분할: Header/Hero/Archive/Verify/Stats/Cta/Footer
    ReportWizard.tsx # 그대로
  styles/
    global.css       # Tailwind (기존)
    landing.css       # (선택) 시안에서 가져온 토큰/애니메이션 등 직접 CSS
```

- 랜딩 페이지는 Tailwind(global.css)를 쓰되, 시안 고유의 CSS 변수·키프레임·복잡 컴포넌트는 `landing.css` 또는 scoped `<style>`로 보완.
- 제보 진입 링크: `<a href={`${import.meta.env.BASE_URL}report`}>`.
- Pretendard: 랜딩(또는 공통) `<head>`에 시안의 CDN link 추가.

### 제보 흐름
- `/report`의 `ReportWizard`는 `0004` 그대로. PUBLIC_* 환경변수·CORS·Turnstile 등 운영 설정은 이미 구성됨(0001/0003/0004).

## 6. 완료 조건 (Acceptance Criteria)

- [x] `/`가 `votatis.html` 시안의 모든 섹션(헤더·히어로·아카이브·검증·통계·CTA·푸터)을 갖춘 랜딩으로 렌더된다(데모 수치·고지문 유지). (확인: 브라우저 스크린샷 — 히어로·대시보드 목업·도넛·차트·푸터 시안 일치)
- [x] `/report`가 제보 마법사(`ReportWizard`)를 렌더하고, 기존 4단계 흐름이 그대로 동작한다. (확인: election select·progressbar 40%·홈 링크)
- [x] 헤더·히어로·최종 CTA·푸터의 "제보하기/제보 보내기"가 모두 `/report`로 이동한다(base path 반영). (확인: 빌드 산출물 제보 링크 `/report`, `import.meta.env.BASE_URL` 사용)
- [x] 랜딩 내 섹션 앵커(`#archive`/`#verify`/`#stats`)와 바닐라 JS(햄버거·reveal·막대 채우기)가 동작한다. (확인: 스크롤 시 verify/stats reveal opacity 1)
- [x] 스타일이 시안과 시각적으로 부합한다. Pretendard가 로드된다. (확인: 스크린샷)
- [x] `astro build` 산출물 `dist/`에 `index.html`·`report/index.html`·`404.html`이 생성되고, 랜딩은 마법사 island JS를 싣지 않는다. (확인: 랜딩 astro-island/ReportWizard 0건)
- [x] 루트 `pnpm -r typecheck`가 통과한다. (intake-api + web 0 errors)

## 7. 미해결 질문 / 리스크

- **아카이브/통계 실데이터** — 현재 데모 값. 공개 레코드 파이프라인(승격·사이트·검색 스펙) 완료 후 실데이터로 교체.
- **외부 링크 타깃** — GitHub·검증 큐·데이터 포맷·기여하기 등은 대상이 정해지면 실제 URL로. 당장은 placeholder.
- **랜딩 nav의 일부 항목**(예: "공개 아카이브")이 추후 별도 페이지가 될지, 랜딩 내 섹션으로 남을지.
- ~~Tailwind preflight vs 시안 CSS 충돌~~ — 랜딩을 독립 문서(Tailwind 미사용)로 두어 원천 차단(요구사항 6).
- **랜딩 self-contained CSS의 향후 유지보수** — Tailwind 디자인 토큰과 별개 체계라, 추후 디자인 시스템 통합 시 토큰 정합 검토 필요.

## Changelog
기능/기술이 크게 바뀐 변경만 한 줄씩. 단순 버그·오타·리팩터링은 제외.
- 2026-06-10: 최초 작성
- 2026-06-10: 구현 — `/`를 votatis.html 시안 랜딩(독립 문서, 시안 CSS 유지, Pretendard, 바닐라 JS)으로, 제보 마법사를 `/report`로 분리. 모든 제보 진입점→`/report`(base path). 스타일은 하이브리드 대신 시안 CSS 그대로 유지(충실도). 브라우저 검증 완료. (요청: 채팅, 시안 votatis.html)
- 2026-06-10: QA — 상단 nav 4개(공개 아카이브·검증 시스템·제보·설계 원칙)와 대시보드 목업 사이드바(`aside.side`)를 임시로 숨김(JSX 주석 처리, 나중에 복원). 사이드바 숨김에 맞춰 `.mock-body` 그리드를 1열로(복원 시 208px 1fr로 되돌림). "제보하기" 버튼은 유지. (요청: 채팅, QA)
- 2026-06-10: QA — nav 항목을 숨긴 김에 모바일 햄버거 버튼도 임시 숨김(주석). 모바일(≤900px)에서 `.nav-right`의 "제보하기"가 노출되도록 미디어쿼리 조정. (요청: 채팅, QA)
