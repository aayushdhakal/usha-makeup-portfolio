CREATE TABLE `studio_accounts` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text DEFAULT 'Studio owner' NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`role` text DEFAULT 'Admin' NOT NULL,
	`avatar_data` text DEFAULT '' NOT NULL,
	`password_hash` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `completed_at` text;--> statement-breakpoint
ALTER TABLE `payments` ADD `kind` text DEFAULT 'payment' NOT NULL;--> statement-breakpoint
ALTER TABLE `staff` ADD `email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `studio_sessions` ADD `device_label` text DEFAULT 'Unknown device' NOT NULL;--> statement-breakpoint
ALTER TABLE `studio_sessions` ADD `last_seen_at` integer DEFAULT 0 NOT NULL;