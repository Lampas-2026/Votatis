---
id: "0004"
title: 제보 플로우 (4단계 마법사)
status: completed
created: 2026-06-10
updated: 2026-06-10
related:
  - "specs/completed/0003-report-web-app.md (현재 단일 폼)"
  - "specs/completed/0001-report-intake-api.md (API 계약 — consent 추가)"
  - "docs/MVP-PRD.md §5 데이터 수집 흐름 / §8 제보 Form 매핑"
  - "디자인 목업: APP·아이폰 390×844·제보 플로우 A-01~A-04 (채팅 첨부)"
  - "https://www.w3.org/WAI/tutorials/forms/multi-page/"
  - "https://designsystem.digital.gov/components/step-indicator/"
---

# 제보 플로우 (4단계 마법사)

## 1. 배경 / 문제

`0003`에서 제보 폼을 단일 화면으로 구현했지만, 디자인 목업(A-01~A-04)은 입력을 **4단계 마법사**로 쪼개 부담을 줄이고 단계별로 맥락(위치·유형 → 상세·출처 → 첨부·동의 → 완료)을 안내한다. 단일 폼을 이 플로우로 재구성하고, 목업에 새로 등장한 요소(유형 칩, 진행도 바, 익명 동의, 접수번호, 최적화 안내)를 프론트와 백엔드에 반영한다.

기존 제출 메커니즘(intake-api 2단계 업로드: `POST /submissions` → presigned `PUT` → `finalize`)은 그대로 쓰고, **화면 구성과 입력 수집 방식만** 바꾼다. 백엔드는 익명 동의 기록을 위한 소폭 수정만 한다.

## 2. 목표 (Goals)

- 제보 입력을 목업대로 4단계 마법사(위치·유형 / 상세·출처 / 첨부·동의 / 완료)로 재구성한다.
- 각 단계에 진행도 바와 단계별 검증을 두고, 마지막에 접수번호와 이후 처리 안내를 보여준다.
- 유형(수치에러/봉인/훼손/지면/기타) 단일선택을 추가해 `tags`에 반영한다.
- 익명 제보·공개 동의를 필수 게이트로 두고 서버(Issue)에 동의 여부를 기록한다.
- 기존 intake-api 제출 흐름과 `0003`의 EXIF·Turnstile·주소 자동완성 자산을 재사용한다.

## 3. 비목표 (Non-Goals)

- ~~이미지 실제 최적화 미구현~~ — **QA에서 해제됨.** 클라 최적화(1920px·WebP)를 실제 구현하고 절감률도 실측값으로 표시한다(요구사항 5 참조).
- save & resume(중간 저장 후 재개), 단계 자유 점프(클릭으로 임의 단계 이동) — 순차 진행 + 이전/다음만.
- 접수번호 체계 신설(`local9-2026-NNNN` 형식). 접수번호는 **생성된 GitHub Issue 번호**를 쓴다.
- 유형용 API 신규 필드. 유형은 기존 `tags`에 넣는다(백엔드 스키마 무변경).
- 디자인 시스템/픽셀 단위 목업 일치. 목업의 구조·요소를 따르되 스타일은 임시 수준.

## 4. 요구사항

### 기능
1. **4단계 마법사** — A-01 위치·유형 → A-02 상세·출처 → A-03 첨부·동의 → A-04 완료. 이전/다음 버튼으로 순차 이동. "다음"은 현재 단계 필수값을 통과해야 활성화(또는 클릭 시 inline 에러).
2. **진행도 바** — 상단에 "작성 완성도"를 단계별로 표시(목업 기준 A-01 40% / A-02 65% / A-03 90% / 완료 100%). 단계 번호도 함께 노출.
3. **A-01 위치·유형** — 선거 드롭다운(0003의 최근 6개), 위치(`RegionAutocomplete` 재사용), 위치 아래 **"위치 무관" 체크박스**(체크 시 위치 입력 disabled, 제출 시 위치값으로 `region.sido = "LOCATION_INDEPENDENT"` 전송), **유형 칩 단일선택**: 수치 에러·봉인·훼손·지면·기타. 선택한 유형은 제출 시 `tags`에 포함한다.
4. **A-02 상세·출처** — 제목(필수), 상세 설명(textarea, **2000자 카운터**, body로 전송), 출처(URL 또는 직접입력 텍스트, 복수 + "출처 추가"). 근거 필수: 출처 또는 첨부 중 최소 하나(0003 로직 재사용).
5. **A-03 첨부·동의** — 카메라 아이콘 큰 버튼("카메라로 촬영 · 사진 선택")으로 이미지를 **여러 개 누적 업로드**(개별 삭제 가능, 최대 10개), 썸네일 그리드에 미리보기 + **EXIF 배지**. **클라 이미지 최적화 실제 구현**: 긴 변 1920px 캡 + WebP(quality 0.8) 변환(`lib/image.ts`), 변환 실패 시 원본 폴백. EXIF는 **최적화 전 원본에서 추출**해 `exif` 메타로 전송(canvas 재인코딩은 EXIF를 제거하므로 메타로 보존). 전체 원본합/최적화합으로 **실측 절감률** 표시. **익명 제보·공개 동의 체크박스(필수)**. 동의 전에는 "제보 보내기" 비활성. 업로드 대상은 최적화된 WebP(`mime: image/webp`)이며 서버 SHA-256은 이 WebP 기준으로 계산된다.
6. **A-04 완료** — 체크 표시, "제보가 접수되었습니다" + 검토 큐 안내, **접수번호 = GitHub Issue 번호**(`finalize` 응답 `issue_url`에서 추출), 이후 처리 3단계 안내(R2 업로드·SHA-256 봉인 / 검토 큐 등록 / 검증 후 공개). "새 제보 작성" 액션.
7. **제출 매핑** — 단계별 입력을 모아 기존 `submitReport`로 전송. `tags` = [유형] + 사용자 태그, `body` = 상세 설명, `consent` = 동의 여부. 흐름·에러 처리(403/429/400)는 0003 재사용.

### 비기능
8. **단계별 검증** — 현재 단계 필수값 미충족 시 다음 단계로 못 넘어가고 inline 안내. (A-01: 선거·위치·유형 / A-02: 제목 + 근거 / A-03: 동의)
9. **접근성(멀티스텝 모범사례)** — 단계 전환 시 키보드 포커스를 새 단계 첫 필드로 이동, 진행 표시에 `aria-valuenow`/`aria-valuemax`, 단계 변경을 스크린리더에 알림(landmark/role). 출처: W3C WAI multi-page forms, USWDS step-indicator.
10. **백엔드 동의 기록** — intake-api `SubmissionInput`에 `consent`(boolean) 추가, Issue 본문에 동의 여부 기록. 없거나 false면 제출은 클라에서 막지만 서버도 값이 있으면 그대로 기록.

### 기술 스택
- 프론트: 기존 `apps/web` Astro + React island. 마법사 상태는 컴포넌트 내 단계 state로 관리(라우팅 분리 안 함).
- 백엔드: `apps/intake-api`에 `consent` 필드 추가(types/openapi/github).
- 재사용: `lib/api.ts`(submitReport), `lib/exif.ts`, `lib/turnstile.ts`, `RegionAutocomplete`.

## 5. 설계 개요

### 단계 / 상태

```
ReportWizard (React island)
  step: 0..3  (A-01 위치·유형 / A-02 상세·출처 / A-03 첨부·동의 / A-04 완료)
  진행도: [40, 65, 90, 100][step]
  공통 폼 state: election, region(text+pick), type, title, body, sources[], files[], exif[], consent, turnstile_token
  단계 컴포넌트: StepLocationType / StepDetailSource / StepAttachConsent / StepDone
```

### 유형 → tags 매핑
- 유형 칩 단일선택값(예: "봉인")을 제출 `tags` 배열 맨 앞에 넣고, 사용자가 입력한 태그가 있으면 뒤에 합친다. (백엔드 스키마 무변경)

### 접수번호
- `finalize` 응답 `issue_url`에서 끝 숫자를 추출(`/issues/{n}` 또는 `/simulate/issues/{n}`) → "접수번호 #{n}" **텍스트로만** 표시한다(링크 없음).

### 동의(consent)
- 클라: 체크 안 하면 "제보 보내기" 비활성(게이트).
- 서버: `SubmissionInput.consent` 수신 → `buildIssueBody`에 `consent: true/false` 한 줄 기록(실명·연락처는 여전히 미저장, 익명 해시만).

### 제출 흐름
- A-03에서 "제보 보내기" → 기존 `submitReport(input, files, onProgress)` 호출 → 성공 시 step=3(완료)로 전환하며 접수번호 표시. 실패 시 현재 단계에서 에러 안내(0003의 `errorMessageFor`).

## 6. 완료 조건 (Acceptance Criteria)

- [x] 제보 입력이 A-01~A-04 4단계로 나뉘고 이전/다음으로 순차 이동하며, 상단 진행도 바가 단계별 값(40/65/90/100%)을 표시한다. (확인: 브라우저로 각 단계 progressbar aria-valuenow 40/65/90/100)
- [x] A-01에서 선거·위치·유형(칩 단일선택)을 입력/선택하지 않으면 다음 단계로 넘어가지 못한다. (확인: 초기 다음 disabled, 위치+유형 채우면 활성화)
- [x] A-01 "위치 무관" 체크 시 위치 입력이 disabled되고 위치 없이도 다음으로 넘어가며, 제출 시 `region.sido = "LOCATION_INDEPENDENT"`가 전송된다. (확인: 위치 무관 제보 → Issue #6 `region.sido: "LOCATION_INDEPENDENT"`)
- [x] 선택한 유형이 제출 `tags`에 포함되어 생성된 Issue 본문 `tags`에 나타난다. (확인: 봉인 선택 → Issue #5 `tags: ["봉인"]`)
- [x] A-02 상세 설명에 글자수 카운터가 동작하고 2000자를 초과 입력할 수 없다. (확인: "38 / 2000" 카운터 + maxLength=2000)
- [~] 출처(URL/텍스트)도 첨부도 없으면 다음으로 못 넘어간다. — 첨부는 A-03에서 추가되므로 근거(출처/첨부) 게이트는 **최종 제출(A-03 "제보 보내기")**에서 enforce하도록 변경(`canSubmit`에 `hasEvidence`). A-02 "다음"은 제목만 필수. (스펙 의도 반영, 위치만 §3 비고 참고)
- [x] A-03에서 이미지를 여러 개 누적 업로드하고 개별 삭제할 수 있으며, 카메라 버튼·썸네일 그리드·EXIF 배지가 보인다. (확인: 2개 업로드 → 썸네일 2·배지 2·삭제로 2→1)
- [x] 클라에서 이미지가 1920px·WebP로 최적화되고(`lib/image.ts`), 절감률이 실측값으로 표시되며, EXIF는 원본에서 추출돼 메타로 전송된다. — 최적화/EXIF 파이프라인 구현 + typecheck. **첨부 포함 전 흐름을 `wrangler dev --remote`(실 R2)로 라이브 검증**: 업로드본 `filename: shot.webp` / `mime: image/webp` / 서버계산 `sha256` 가 Issue 본문에 기록됨(정식 key 이동 포함). 로컬 비-remote 에선 presigned PUT 대상(실 R2)과 finalize R2(로컬)가 달라 "업로드되지 않은 첨부" 400이 나므로 `--remote` 필요.
- [x] 익명 동의 체크 전에는 "제보 보내기"가 비활성이고, 체크하면 활성화된다. (확인: 체크 전 disabled → 체크 후 enabled)
- [x] 제출 성공 시 A-04에 접수번호(GitHub Issue 번호)와 이후 처리 안내가 표시된다. (확인: "접수번호 #5" + 이후 처리 3단계)
- [x] intake-api `SubmissionInput`에 `consent`가 추가되고, 동의 여부가 Issue 본문에 기록된다. (확인: vitest `consent: true` 단언 + Issue #5 `consent: true`)
- [x] 단계 전환 시 포커스가 새 단계 첫 필드로 이동하고, 진행 표시에 aria 속성이 있다. (확인: progressbar aria-valuenow/min/max, step 전환 시 포커스 이동, sr-only aria-live)
- [x] 로컬 intake-api(`SIMULATE_GITHUB`)를 상대로 전 흐름이 끝까지 성공한다. (확인: 4단계 → Issue #5 생성)
- [x] 루트 `pnpm -r typecheck`가 통과한다. (intake-api tsc + web astro check 모두 0 errors)

## 7. 미해결 질문 / 리스크

- **유형 라벨 형식** — `tags`에 한글 라벨("봉인")을 그대로 넣을지, 영문 키("seal")로 정규화할지. 일단 한글 라벨로 두되 검토 시 확정.
- **진행도 % 산정** — 목업의 40/65/90을 단계 고정값으로 쓴다(입력 충족률 동적 계산 아님). 추후 동적화 가능.
- **이미지 최적화(구현됨)** — 1920px·WebP 클라 최적화 구현. 업로드본이 WebP이므로 서버 SHA-256은 WebP 기준이며, 원본 바이트는 보존하지 않는다(EXIF는 메타로만 보존). 원본 무결성/보존이 필요해지면 정책 재검토.
- **consent 보관 위치** — Issue 본문 frontmatter에 `consent`로 기록. 레코드 스키마(PRD §7)에 정식 편입할지는 데이터 스키마 확정 스펙에서 다룬다.
- **근거 게이트 위치(구현 중 결정)** — 첨부가 A-03에서 추가되는 4단계 흐름이라, "출처 또는 첨부 최소 하나"를 A-02가 아니라 최종 제출(A-03)에서 막도록 했다. A-02 "다음"은 제목만 필수. 목업 A-02의 "최소 1개 필수"는 안내 문구로 표시.
- **요약/발생일시/자유태그 제외** — 목업(A-01~A-03)에 없어 0003 폼의 summary·occurred_at·자유 태그 입력을 마법사에서 제외했다. tags는 유형 1개만 전송. 필요 시 후속에서 재도입.

## Changelog
기능/기술이 크게 바뀐 변경만 한 줄씩. 단순 버그·오타·리팩터링은 제외.
- 2026-06-10: 최초 작성
- 2026-06-10: 구현 — `ReportWizard`(4단계, 진행도, 유형 칩→tags, 2000자 카운터, 익명 동의, 접수번호=Issue #, 포커스/aria 접근성)로 단일 폼 대체(`ReportForm` 제거). intake-api에 `consent` 필드 추가(types/openapi/Issue 본문 + vitest). 근거 게이트는 최종 제출로 이동, summary·occurred_at·자유태그는 목업에 맞춰 제외. 로컬 전 흐름 브라우저 검증(Issue #5). (요청: 채팅 + 디자인 목업)
- 2026-06-10: A-01에 "위치 무관" 체크박스 추가 — 체크 시 위치 입력 disabled + 위치 검증 면제, 제출 시 `region.sido = "LOCATION_INDEPENDENT"` 전송(Issue #6 확인). (요청: 채팅, QA)
- 2026-06-10: A-03 첨부 고도화 — 다중 누적 업로드+개별 삭제, 카메라 버튼·썸네일 그리드·EXIF 배지 UI, **클라 이미지 최적화 실제 구현**(1920px·WebP, `lib/image.ts`)으로 비목표 해제, EXIF는 원본에서 추출해 메타 전송, 실측 절감률 표시. 업로드본=WebP라 SHA-256은 WebP 기준. (요청: 채팅+목업, QA)
- 2026-06-10: A-04 접수번호를 링크 없이 텍스트로만 표시(이전엔 issue_url 링크). 업로드 버튼 Material 아이콘화, 비활성 위치 input 회색 배경 등 UI 다듬기 동반. (요청: 채팅, QA)
