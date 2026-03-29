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

/**
 * Tabela de uploads de relatórios de Shopee Ads.
 * Armazena metadados de cada upload de arquivo CSV.
 */
export const shopeeAdsUploads = mysqlTable("shopee_ads_uploads", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  totalAds: int("totalAds").notNull().default(0),
  periodStart: varchar("periodStart", { length: 10 }),
  periodEnd: varchar("periodEnd", { length: 10 }),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type ShopeeAdsUpload = typeof shopeeAdsUploads.$inferSelect;
export type InsertShopeeAdsUpload = typeof shopeeAdsUploads.$inferInsert;

/**
 * Tabela de dados de anúncios do Shopee Ads.
 * Armazena cada linha do relatório de anúncios.
 */
export const shopeeAdsData = mysqlTable("shopee_ads_data", {
  id: int("id").autoincrement().primaryKey(),
  uploadId: int("uploadId").notNull(),
  adNumber: int("adNumber"),
  adName: text("adName"),
  status: varchar("status", { length: 50 }),
  adType: varchar("adType", { length: 100 }),
  productId: varchar("productId", { length: 50 }),
  bidMethod: text("bidMethod"),
  placement: varchar("placement", { length: 50 }),
  keyword: text("keyword"),
  combinationType: varchar("combinationType", { length: 50 }),
  startDate: varchar("startDate", { length: 50 }),
  endDate: varchar("endDate", { length: 50 }),
  impressions: int("impressions").default(0),
  clicks: int("clicks").default(0),
  ctr: double("ctr").default(0),
  conversions: int("conversions").default(0),
  directConversions: int("directConversions").default(0),
  conversionRate: double("conversionRate").default(0),
  directConversionRate: double("directConversionRate").default(0),
  costPerConversion: double("costPerConversion").default(0),
  costPerDirectConversion: double("costPerDirectConversion").default(0),
  itemsSold: int("itemsSold").default(0),
  directItemsSold: int("directItemsSold").default(0),
  gmv: double("gmv").default(0),
  directRevenue: double("directRevenue").default(0),
  spend: double("spend").default(0),
  roas: double("roas").default(0),
  directRoas: double("directRoas").default(0),
  acos: double("acos").default(0),
  directAcos: double("directAcos").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopeeAdsData = typeof shopeeAdsData.$inferSelect;
export type InsertShopeeAdsData = typeof shopeeAdsData.$inferInsert;
