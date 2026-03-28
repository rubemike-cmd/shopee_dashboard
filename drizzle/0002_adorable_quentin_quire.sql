CREATE TABLE `dashboard_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weeklyRevenue` double NOT NULL DEFAULT 0,
	`weeklyProfit` double NOT NULL DEFAULT 0,
	`monthlyRevenue` double NOT NULL DEFAULT 0,
	`monthlyProfit` double NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_goals_id` PRIMARY KEY(`id`)
);
