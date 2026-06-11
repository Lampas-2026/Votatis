// 제보 분류·검증 상태 타입과 라벨.
// NOTE: upstream 머지 시 .gitignore `lib/` 규칙으로 원본 src/lib/types.ts 가 누락돼,
// 사용처(ArchiveClient/SearchClient/ReportFlow/ui)에서 역추출해 재구성한 것이다.
// VerifyStatus 는 intake-api/PRD 상태값과 일치. 카테고리/유형 라벨은 추후 실제 분류로 조정 가능.

/** 제보 대분류. */
export type Category = "A" | "B" | "C";

/** 검증 상태 — intake-api `reports.status`(pending 제외 공개 상태)와 동일. */
export type VerifyStatus =
  | "unverified"
  | "reviewing"
  | "confirmed"
  | "disputed"
  | "debunked"
  | "corrected";

/** 카테고리 짧은 라벨(버튼·칩). */
export const CATEGORY_LABEL: Record<Category, string> = {
  A: "투·개표",
  B: "사전투표",
  C: "전산·집계",
};

/** 카테고리 전체 라벨(필터·상세). */
export const CATEGORY_FULL: Record<Category, string> = {
  A: "투표·개표 과정",
  B: "사전투표·우편투표",
  C: "전산·통계 이상",
};

/** 카테고리별 세부 유형 목록. */
export const TYPE_SETS: Record<Category, string[]> = {
  A: ["투표지 부족·과다", "개표 집계 오류", "투표함 관리", "참관 방해", "투표소 운영"],
  B: ["사전투표지 관리", "본인확인 절차", "관외 우편투표", "사전투표함 보관"],
  C: ["전산 집계 이상", "통계적 이상치", "출구조사 불일치", "시스템·보안"],
};

/** 검증 상태 라벨. */
export const STATUS_LABEL: Record<VerifyStatus, string> = {
  unverified: "미검증",
  reviewing: "검토 중",
  confirmed: "사실확인",
  disputed: "이견 있음",
  debunked: "반박됨",
  corrected: "정정됨",
};

/** 검증 상태 칩 CSS variant 클래스(`chip <variant>`). globals 에서 색 지정 가능. */
export const STATUS_CHIP: Record<VerifyStatus, string> = {
  unverified: "unv",
  reviewing: "rev",
  confirmed: "ok",
  disputed: "dis",
  debunked: "deb",
  corrected: "cor",
};
