CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`action` text NOT NULL,
	`target` text NOT NULL,
	`payload` text,
	`result` text NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE INDEX `activity_log_at_idx` ON `activity_log` (`at`);--> statement-breakpoint
CREATE TABLE `api_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`etag` text,
	`payload` text NOT NULL,
	`fetched_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `api_cache_expires_at_idx` ON `api_cache` (`expires_at`);--> statement-breakpoint
CREATE TABLE `auth` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`password_salt` text NOT NULL,
	`password_hash` text NOT NULL,
	`scrypt_params` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`at` integer NOT NULL,
	`success` integer NOT NULL,
	`locked_until` integer
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`repo_id` integer,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notes_repo_id_idx` ON `notes` (`repo_id`);--> statement-breakpoint
CREATE TABLE `pinned` (
	`repo_id` integer PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`pinned_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_config` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`headline` text NOT NULL,
	`bio` text NOT NULL,
	`socials` text NOT NULL,
	`theme` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`repo_id` integer PRIMARY KEY NOT NULL,
	`position` integer NOT NULL,
	`custom_title` text,
	`custom_blurb` text,
	`cover_path` text,
	`visible` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limit_snapshot` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`remaining` integer NOT NULL,
	`limit` integer NOT NULL,
	`reset_at` integer NOT NULL,
	`recorded_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `read_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`repo_full_name` text NOT NULL,
	`number` integer NOT NULL,
	`read_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `read_state_kind_repo_number_unique` ON `read_state` (`kind`,`repo_full_name`,`number`);--> statement-breakpoint
CREATE TABLE `repo_tags` (
	`repo_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`repo_id`, `tag_id`),
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);