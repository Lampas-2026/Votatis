CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`election` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`body` text,
	`sido` text,
	`sigungu` text,
	`eup_myeon_dong` text,
	`occurred_at` text,
	`collected_at` text NOT NULL,
	`tags` text NOT NULL,
	`sources` text NOT NULL,
	`attachments` text NOT NULL,
	`exif` text,
	`rebuttals` text,
	`related` text,
	`consent` integer,
	`submitter` text NOT NULL,
	`license` text NOT NULL,
	`verification_reviewer` text,
	`verification_method` text,
	`verification_reviewed_at` text,
	`verification_notes` text,
	`verification_evidence_links` text,
	`finalize_token` text,
	`staging` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_reports_status` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `idx_reports_election` ON `reports` (`election`);--> statement-breakpoint
CREATE INDEX `idx_reports_region` ON `reports` (`sido`,`sigungu`);--> statement-breakpoint
CREATE INDEX `idx_reports_occurred_at` ON `reports` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_reports_collected_at` ON `reports` (`collected_at`);