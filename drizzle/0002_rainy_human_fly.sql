CREATE TABLE `studio_login_attempts` (
	`client_key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`failures` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `studio_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_studio_sessions_expires` ON `studio_sessions` (`expires_at`);