import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/** JSON 컬럼에 들어가는 출처 한 건. url(웹사이트) 또는 text(직접 입력) 중 하나 이상. */
export interface SourceRecord {
  url?: string;
  text?: string;
  type?: string; // news | official | social | submitter | crawler
  captured_at?: string;
  archive_url?: string;
}

/** JSON 컬럼에 들어가는 첨부 한 건. sha256 정본은 서버가 finalize 에서 계산한다. */
export interface AttachmentRecord {
  filename: string;
  r2_key: string;
  sha256: string;
  mime: string;
  size: number;
}

/** finalize 전까지만 유지되는 staging 정보(업로드 대상 key 매핑). */
export interface StagingItem {
  staging_key: string;
  final_key: string;
  filename: string;
  mime: string;
  size: number;
}

export interface RebuttalRecord {
  text: string;
  source_url?: string;
}

/**
 * 제보 레코드 — PRD §7 스키마를 최대한 flatten 한 단일 테이블.
 * 단일값 필드(region·verification)는 컬럼으로 펼치고, 진짜 배열만 JSON(TEXT) 컬럼.
 * status='pending' 은 2단계 업로드의 내부 중간상태로, 조회 API 에 노출하지 않는다.
 */
export const reports = sqliteTable(
  "reports",
  {
    id: text("id").primaryKey(), // = submission_id
    status: text("status").notNull(), // pending | unverified | reviewing | confirmed | disputed | debunked | corrected
    election: text("election").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    body: text("body"),

    // region 펼침
    sido: text("sido"),
    sigungu: text("sigungu"),
    eupMyeonDong: text("eup_myeon_dong"),

    occurredAt: text("occurred_at"),
    collectedAt: text("collected_at").notNull(),

    // 배열 → JSON
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull(),
    sources: text("sources", { mode: "json" }).$type<SourceRecord[]>().notNull(),
    attachments: text("attachments", { mode: "json" }).$type<AttachmentRecord[]>().notNull(),
    exif: text("exif", { mode: "json" }).$type<unknown[]>(),
    rebuttals: text("rebuttals", { mode: "json" }).$type<RebuttalRecord[]>(),
    related: text("related", { mode: "json" }).$type<string[]>(),

    consent: integer("consent", { mode: "boolean" }),
    submitter: text("submitter").notNull(), // 익명 해시. 조회 응답에서 제외
    license: text("license").notNull(),

    // verification 펼침 — 본 스펙은 null 로 생성, 검수 스펙(0007)이 채운다
    verificationReviewer: text("verification_reviewer"),
    verificationMethod: text("verification_method"),
    verificationReviewedAt: text("verification_reviewed_at"),
    verificationNotes: text("verification_notes"),
    verificationEvidenceLinks: text("verification_evidence_links", { mode: "json" }).$type<string[]>(),

    // pending 동안만 — finalize 후 null
    finalizeToken: text("finalize_token"),
    staging: text("staging", { mode: "json" }).$type<StagingItem[]>(),

    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => ({
    statusIdx: index("idx_reports_status").on(t.status),
    electionIdx: index("idx_reports_election").on(t.election),
    regionIdx: index("idx_reports_region").on(t.sido, t.sigungu),
    occurredIdx: index("idx_reports_occurred_at").on(t.occurredAt),
    collectedIdx: index("idx_reports_collected_at").on(t.collectedAt),
  }),
);

/** IP 기준 고정 윈도우 rate limit (KV 제거에 따라 D1 로 이전). expires_at 은 epoch 초. */
export const rateLimits = sqliteTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

export type ReportRow = typeof reports.$inferSelect;
export type ReportInsert = typeof reports.$inferInsert;
