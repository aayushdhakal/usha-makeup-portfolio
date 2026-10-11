DROP INDEX `idx_clients_phone`;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_clients_phone_name` ON `clients` (`phone`,`name`);