## 1. 목적

분산되어 사라지는 증거와 제보를 하나의 검증 가능한 데이터베이스로 모은다. 단발성이 아니라 누구든 기여하고 이어서 유지보수할 수 있게 설계한다.

핵심은 기술이 아니라 신뢰도다. "이게 확인된 사실인지, 단순 주장인지, 반박된 건지"를 명확히 구분하는 것이 이 프로젝트의 존재 이유다. 검증 상태 구분이 없으면 아카이브는 음모론 덤프와 다를 게 없다.

## 2. 설계 원칙

1. 검증 우선. 미검증 데이터와 사실확인 데이터를 절대 같은 무게로 표시하지 않는다.
2. 출처 추적. 모든 레코드는 출처와 시점을 갖는다. 출처 없는 항목은 등록 불가.
3. 무결성 증명. 첨부파일은 해시로 봉인한다. 사후 변조 여부를 누구나 확인 가능하게.
4. 중립 서술. 주장과 사실을 문장 차원에서 분리한다. 단정 금지, 라벨로 표현.
5. 개방 기여. 데이터 포맷과 검증 절차를 공개한다. 특정 개인 종속 금지.
6. 최소 노출. 개인 실명, 사생활 정보는 최소화한다. 정정과 삭제 경로를 처음부터 둔다.

## 3. v1 범위

- 제보 접수 API - Cloudflare Worker / R2
- 검증 Queue - GitHub Issues
- 검증 후 레포에 등록, 승격 - 자체 스크립트
- 정적 사이트 (GitHub Pages)
- 벡터/시맨틱 검색

## 4. 시스템 아키텍쳐

```
[제보자/크롤러]
      |
      v
[Cloudflare Worker]  --첨부파일-->  [R2 스토리지]
      |  (정규화 + 해시 + 임시 토큰)
      v
[GitHub Issues]   <-- 검증 큐
      |  (팀원 검수: 승인/보완/거절)
      v
[승격 스크립트 / GitHub Action]
      |  (스키마 검증 + 커밋)
      v
[공개 레포: /data/*.md + 인덱스]
      |
      v
[GitHub Pages: 정적 사이트 + 클라이언트 검색]
```

역할 분리:

Worker는 수집과 정규화만 담당. 판단하지 않는다.
검증 판단은 사람이 큐에서 한다.
공개 레포에는 검증 통과 데이터만 들어간다.

## 5. 데이터 수집 흐름

1. 웹 앱을 통해 EXIF 추출. API 사용해서 제보 접수.
2. API 에서 정해진 포맷으로 GitHub Issue 등록
3. 팀원이 (또는 AI가) 내부 도구 사용하여 GitHub Issue 리스팅하여 검수, 승인, 보완, 거절
   > 이 과정에서 AI 분석, 자동 태깅, 합성 식별
4. 내부 스크립트 통해서 승인된 내용 레포에 반영, 배포.

## 6. 검증 워크플로우

- 출처 원본 접근 가능 여부 확인. archive.org 등으로 스냅샷 확보
- 주장과 사실 분리. 단정 문장은 라벨 문장으로 교정
- 개인 식별 정보 마스킹
- 검증 근거 링크 기록
- 필요한 내용이 있으면 보완. 그 후 승인 또는 거절

> 추후 제보자가 보완할 수 있도록 설계하는 방안 고려.

## 7. 데이터 스키마

레코드는 공개 레포에 `/data/{election}/{id}.md` 한 건당 한 파일. YAML frontmatter + 마크다운 본문.

스키마는 더욱 구체화 필요.

### 레코드 예시

```yaml
---
id: "local8-2026-0001"
election: "제8회 전국동시지방선거"
title: "OO 개표소 투표지 부족 신고"
summary: "투표 종료 전 일부 사전투표지 소진 보고. 사실확인 완료."
status: "confirmed" # unverified | reviewing | confirmed | disputed | debunked | corrected
tags: ["투표지부족", "사전투표", "개표소"]
counting_unit: "OO구 제3개표소"
region:
  sido: "경기도"
  sigungu: "성남시 분당구"
  eup_myeon_dong: null
occurred_at: "2026-06-03T16:20:00+09:00"
collected_at: "2026-06-03T22:10:00+09:00"
sources:
  - url: "https://example.com/report"
    type: "news" # news | official | social | submitter | crawler
    captured_at: "2026-06-03T22:08:00+09:00"
    archive_url: "https://web.archive.org/..."
attachments:
  - filename: "ballot_shortage.jpg"
    r2_key: "local8-2026/0001/ballot_shortage.jpg"
    sha256: "9f86d0818..."
    mime: "image/jpeg"
    size: 482113
verification:
  reviewer: "reviewer-a1"
  method: "원본 영상 대조, 선관위 공지 교차확인"
  evidence_links:
    - "https://example.com/nec-notice"
  reviewed_at: "2026-06-04T09:00:00+09:00"
  notes: "수량 정확치는 미확정. 부족 사실 자체는 확인."
rebuttals:
  - text: "선관위는 예비 투표지로 즉시 보충했다고 발표."
    source_url: "https://example.com/nec-statement"
related: ["local8-2026-0002"]
submitter: "anon-7c3" # 익명화 ID. 실명/연락처 비저장
license: "CC-BY-4.0"
---
본문 (마크다운). 시간순 경위, 근거, 한계 명시.
```

### 필드 원칙

status 와 verification 은 필수. 출처 없으면 등록 불가.
occurred_at 과 collected_at 분리. 발생 시점과 수집 시점은 다르다.
region 은 개표단위보다 잘게. 시도/시군구/읍면동 3단.
rebuttals 는 비워두지 않기를 권장. 반론 부재 자체도 기록 가치.
submitter 는 익명 해시. 실명, 전화, 이메일은 저장하지 않는다.

## 8. 제보 Form 매핑

제보를 할 때 GitHub Issue Form(.github/ISSUE_TEMPLATE/report.yml)을 스키마와 1:1로 둔다. Worker가 만드는 Issue 본문도 같은 구조를 따른다. 그래야 제보, 검증, 커밋이 한 포맷으로 흐른다.
폼 항목 예시:

- 선거 종류 (dropdown)
- 제목 (input)
- 요약 (input)
- 내용 (textarea)
- 개표 단위 (input)
- 지역 시도/시군구 (dropdown/input)
- 발생일시 (input)
- 출처 URL (textarea, 복수)
- 태그 (input)
- 첨부 (Worker가 R2 키로 채움)

사용자가 Issue 에 직접 추가 가능함. GitHub 계정이 없는 경우 웹앱에서 API 통해서 등록하는 것임.

## 9. 검색과 인덱싱

- v1: 클라이언트 키워드 검색. 수천 건이면 충분히 현실적.

빌드 시 /data/\*.md 를 파싱해 검색 인덱스 JSON 생성 (제목, 요약, 태그, 지역, 선거, status)
라이브러리: Pagefind 또는 MiniSearch. 정적 사이트에 적합.
필터: 선거, status, 지역, 태그, 기간

- v2: 벡터 검색. 임베딩 API만 서버(Worker)에서 호출. 벡터는 Cloudflare Vectorize 또는 사전 생성 후 클라이언트 적재. 데이터 축적 후 도입

## 10. 만들어야 할 내용

1. 제보 수집 API
2. 웹앱
3. GitHub 을 기반으로 돌아갈 스크립트들
4. 내부 데이터 검수 도구, (MCP 기반도 좋을듯)

## 11. 웹 기획

추후 세부적으로 기획 필요 지금 주요 요구사항은

1. 제보할 수 있어야함
2. 프로젝트의 소개, 세부적으로 탐색 할 수 있어야 함.

## 12. 추가 결정사항

- 검증 대기 데이터를 비공개 레포로 할 지 말지
- 출범 전 법률 검토
- 제보자 신원 검증이 필요할 수 있을지
- 일반 사용자의 의견을 작성하는 기능 (GitHub 기반 댓글 시스템?)
