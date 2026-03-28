import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, double } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const spreadsheetUploads = mysqlTable("spreadsheet_uploads", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  totalOrders: int("totalOrders").notNull().default(0),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type SpreadsheetUpload = typeof spreadsheetUploads.$inferSelect;
export type InsertSpreadsheetUpload = typeof spreadsheetUploads.$inferInsert;

/**
 * Tabela de metas personalizáveis do dashboard.
 * Armazena metas de receita e lucro para períodos semanal e mensal.
 */
export const dashboardGoals = mysqlTable("dashboard_goals", {
  id: int("id").autoincrement().primaryKey(),
  weeklyRevenue: double("weeklyRevenue").notNull().default(0),
  weeklyProfit: double("weeklyProfit").notNull().default(0),
  monthlyRevenue: double("monthlyRevenue").notNull().default(0),
  monthlyProfit: double("monthlyProfit").notNull().default(0),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardGoals = typeof dashboardGoals.$inferSelect;
export type InsertDashboardGoals = typeof dashboardGoals.$inferInsert;
