# Specs — 스펙 인덱스

스펙 주도 개발의 스펙 목록. 스펙은 상태별 디렉터리로 분류하며, 상태 전환은 파일 이동으로 표현한다.

```
specs/
  not-started/   # 작성됐지만 구현 전
  in-progress/   # 구현 중
  completed/     # 구현·검토 완료
```

이 표는 **인덱스**다. 스펙을 추가·이동·삭제하면 즉시 맞춘다. 값은 각 스펙 frontmatter와 일치시킨다.

| ID | 제목 | 상태 | 생성일 | 갱신일 | 파일 |
|----|------|------|--------|--------|------|
| 0001 | 제보 수집 API | completed | 2026-06-09 | 2026-06-10 | completed/0001-report-intake-api.md |
| 0002 | 개발환경 GitHub Issue 시뮬레이션 | completed | 2026-06-09 | 2026-06-09 | completed/0002-dev-github-issue-simulation.md |
| 0003 | 제보 웹앱 (임시) | completed | 2026-06-09 | 2026-06-10 | completed/0003-report-web-app.md |
| 0004 | 제보 플로우 (4단계 마법사) | completed | 2026-06-10 | 2026-06-10 | completed/0004-report-flow-wizard.md |
