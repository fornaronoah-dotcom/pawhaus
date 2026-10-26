/**
 * Drizzle-schema — ENKEL beheermetadata voor het admin-paneel.
 *
 * BELANGRIJK: hier wordt NOOIT canonieke productdata gedupliceerd.
 * Shopify blijft de bron van waarheid. Latere fasen voegen tabellen toe
 * (ai_proposals, jobs, job_items, activity_log, media_versions,
 * product_optimization). Fase 1 = enkel auth.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  timestamp,
  bigserial,
  integer,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AdminRole } from "../admin/roles";

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    // Rol als text + CHECK (i.p.v. pgEnum) — Postgres kan enum-waarden niet in
    // een transactie uitbreiden, en Drizzle-migraties draaien in een transactie.
    role: text("role").$type<AdminRole>().notNull().default("editor"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  },
  (t) => [
    check(
      "admin_users_role_check",
      sql`${t.role} in ('owner','admin','marketing','content','editor')`,
    ),
  ],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  // We bewaren ENKEL de SHA-256 hash van het cookie-token (nooit het token zelf).
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ip: text("ip"),
  userAgent: text("user_agent"),
});

export const logSeverity = pgEnum("log_severity", ["info", "warn", "error"]);

/**
 * Audit-log van beheeracties (write-backs naar Shopify, fouten, later AI-acties
 * en syncs). Geen productdata-bron — enkel een logboek.
 */
export const activityLog = pgTable(
  "activity_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actor: text("actor").notNull(), // gebruiker-id of 'system'/'ai'/'webhook'
    action: text("action").notNull(), // bv. 'product.update'
    targetType: text("target_type"), // bv. 'product'
    targetId: text("target_id"), // bv. shopify product gid
    severity: logSeverity("severity").notNull().default("info"),
    message: text("message"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("activity_log_created_at_idx").on(t.createdAt),
    index("activity_log_target_idx").on(t.targetId),
  ],
);

/**
 * Optimalisatie-/AI-workflowstatus per Shopify-product. Dit is beheermetadata
 * (geen productdata-bron): de levenscyclus van handmatige/AI-controle.
 * Geen rij = "niet_gecontroleerd".
 */
export const optStatus = pgEnum("opt_status", [
  "niet_gecontroleerd",
  "klaar_voor_ai",
  "ai_voorstel_gemaakt",
  "goedgekeurd",
  "gepubliceerd",
]);

export const productStatus = pgTable("product_status", {
  shopifyProductGid: text("shopify_product_gid").primaryKey(),
  status: optStatus("status").notNull().default("niet_gecontroleerd"),
  updatedBy: uuid("updated_by").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Beeld-review drafts: door de gebruiker (na bewerking in Google Flow)
 * geüploade afbeeldingen, die als concept wachten op goedkeuring. De binaire
 * data staat als base64 in Postgres (beheermetadata/draft, geen Shopify-bron).
 * Pas bij expliciete goedkeuring wordt het naar Shopify gepubliceerd.
 */
export const mediaReviewStatus = pgEnum("media_review_status", [
  "draft",
  "published_extra",
  "published_main",
  "discarded",
]);

export const mediaReview = pgTable("media_review", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopifyProductGid: text("shopify_product_gid").notNull(),
  numericId: text("numeric_id").notNull(),
  originalMediaId: text("original_media_id"),
  originalUrl: text("original_url"),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  dataBase64: text("data_base64").notNull(),
  status: mediaReviewStatus("status").notNull().default("draft"),
  shopifyMediaId: text("shopify_media_id"),
  createdBy: uuid("created_by").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Markering dat een originele Shopify-foto naar Google Flow is gestuurd. */
export const flowSent = pgTable("flow_sent", {
  shopifyMediaId: text("shopify_media_id").primaryKey(),
  shopifyProductGid: text("shopify_product_gid").notNull(),
  createdBy: uuid("created_by").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Feature flags: schakel admin-modules geleidelijk aan/uit. Geen rij voor een
 * key = de standaardwaarde uit DEFAULT_FLAGS (lib/admin/feature-flags.ts).
 */
export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * AI-tekstvoorstellen (drafts). Door Gemini gegenereerde productteksten die
 * als concept in Postgres staan. Worden NOOIT automatisch gepubliceerd — pas
 * na handmatige goedkeuring schrijft de admin ze naar Shopify.
 */
export const aiProposalStatus = pgEnum("ai_proposal_status", [
  "pending",
  "applied",
  "rejected",
]);

export const aiProposals = pgTable("ai_proposals", {
  id: uuid("id").defaultRandom().primaryKey(),
  shopifyProductGid: text("shopify_product_gid").notNull(),
  numericId: text("numeric_id").notNull(),
  status: aiProposalStatus("status").notNull().default("pending"),
  fields: jsonb("fields").notNull(), // { title, descriptionHtml, seoTitle, metaDescription, tags }
  appliedFields: text("applied_fields").array(),
  model: text("model"),
  createdBy: uuid("created_by").references(() => adminUsers.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Giveaways (eigen Postgres-data — geen Shopify-bron). Deelnemers schrijven in
 * via een publiek formulier; de admin trekt een winnaar.
 */
export const giveawayStatus = pgEnum("giveaway_status", ["draft", "open", "closed"]);

export const giveaways = pgTable("giveaways", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  prize: text("prize"),
  status: giveawayStatus("status").notNull().default("draft"),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  winnerEntryId: uuid("winner_entry_id"),
  createdBy: uuid("created_by").references(() => adminUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const giveawayEntries = pgTable(
  "giveaway_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    giveawayId: uuid("giveaway_id")
      .notNull()
      .references(() => giveaways.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("giveaway_entry_unique").on(t.giveawayId, t.email)],
);

/**
 * Content-banners (eigen Postgres-data) voor de storefront-announcementbalk.
 * De storefront toont de actieve banner met de hoogste sorteervolgorde.
 */
export const contentBanners = pgTable("content_banners", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  linkUrl: text("link_url"),
  active: boolean("active").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ContentBanner = typeof contentBanners.$inferSelect;

/**
 * Favorieten van klanten (eigen Postgres-data). Gekoppeld aan het Shopify
 * customer-id uit de Customer Account API. Shopify slaat geen verlanglijst op,
 * dus dit is de bron van waarheid voor favorieten. Gasten bewaren favorieten in
 * localStorage; bij inloggen worden die naar deze tabel ge-merged.
 */
export const customerFavorites = pgTable(
  "customer_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: text("customer_id").notNull(),
    productHandle: text("product_handle").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("customer_favorites_unique").on(t.customerId, t.productHandle),
    index("customer_favorites_customer_idx").on(t.customerId),
  ],
);

export type CustomerFavorite = typeof customerFavorites.$inferSelect;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type AiProposal = typeof aiProposals.$inferSelect;
export type Giveaway = typeof giveaways.$inferSelect;
export type GiveawayEntry = typeof giveawayEntries.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
export type ProductStatusRow = typeof productStatus.$inferSelect;
export type OptStatus = (typeof optStatus.enumValues)[number];
export type MediaReview = typeof mediaReview.$inferSelect;
