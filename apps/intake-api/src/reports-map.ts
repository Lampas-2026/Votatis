import type { ReportRow } from "./db/schema";

function region(r: ReportRow) {
  return {
    sido: r.sido ?? undefined,
    sigungu: r.sigungu ?? undefined,
    eup_myeon_dong: r.eupMyeonDong ?? undefined,
  };
}

/** 공개 조회 상세 — submitter·finalize_token·staging 등 내부 필드는 제외한다. */
export function toPublicReport(r: ReportRow) {
  return {
    id: r.id,
    status: r.status,
    election: r.election,
    title: r.title,
    summary: r.summary ?? null,
    body: r.body ?? null,
    region: region(r),
    occurred_at: r.occurredAt ?? null,
    collected_at: r.collectedAt,
    tags: r.tags ?? [],
    sources: r.sources ?? [],
    attachments: r.attachments ?? [],
    rebuttals: r.rebuttals ?? null,
    related: r.related ?? null,
    consent: r.consent ?? null,
    license: r.license,
    verification: {
      reviewer: r.verificationReviewer ?? null,
      method: r.verificationMethod ?? null,
      reviewed_at: r.verificationReviewedAt ?? null,
      notes: r.verificationNotes ?? null,
      evidence_links: r.verificationEvidenceLinks ?? null,
    },
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

/** 목록 요약 — 본문(body)·출처 등 큰 필드 제외. */
export function toSummary(r: ReportRow) {
  return {
    id: r.id,
    status: r.status,
    election: r.election,
    title: r.title,
    summary: r.summary ?? null,
    region: region(r),
    occurred_at: r.occurredAt ?? null,
    collected_at: r.collectedAt,
    tags: r.tags ?? [],
    attachment_count: (r.attachments ?? []).length,
  };
}
