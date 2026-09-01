import "server-only";

import type { Payload } from "payload";

/**
 * Repair the database schema to match the Payload collections.
 *
 * Payload only auto-pushes schema in development (push is off when
 * NODE_ENV === "production"), and this project has no migrations — so on the
 * live (Vercel) database, any table/column added since the DB was first set
 * up is missing. The native admin requires an exact schema match, so missing
 * tables/columns break it (opening documents, the account/avatar menu, whole
 * collections). This includes Payload internals like payload_locked_documents
 * and payload_preferences which the admin uses for doc-locking and UI state.
 *
 * We cannot use Payload push at runtime (drizzle-kit push trips over
 * "column id is in a primary key" on some Postgres). Instead we apply the full
 * schema as purely-additive, idempotent DDL (CREATE TYPE/TABLE IF NOT EXISTS +
 * ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS), generated from a real
 * dev-push schema. Safe to run on every boot; runs once per instance. Each
 * statement is best-effort — a failure is logged and never aborts the rest.
 */
const STATEMENTS: string[] = [
  "DO $$ BEGIN CREATE TYPE \"enum_consultations_status\" AS ENUM ('draft','submitted','reviewed','approved','rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_discounts_type\" AS ENUM ('percentage','fixed'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_orders_payment_method\" AS ENUM ('test','card','paypal','apple_pay','google_pay','bank_transfer'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_orders_payment_status\" AS ENUM ('unpaid','awaiting','paid','refunded','failed'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_orders_status\" AS ENUM ('pending','paid','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_posts_category\" AS ENUM ('weight-loss','nutrition','lifestyle','science','company-news','other'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_posts_status\" AS ENUM ('draft','published'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_products_category\" AS ENUM ('medication','supplement','accessory','other'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_products_treatment\" AS ENUM ('weight-loss','erectile-dysfunction','period-delay'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "DO $$ BEGIN CREATE TYPE \"enum_users_role\" AS ENUM ('admin','customer','staff'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  // Existing DBs created the enum before "staff" existed — add it idempotently
  // so a user can be granted the analytics-only staff role.
  "ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'staff'",
  // Per-section staff permissions (array of section keys).
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"permissions\" jsonb",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"totp_secret\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"totp_enabled\" boolean DEFAULT false",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"email_otp_hash\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"email_otp_expires\" timestamptz",
  "CREATE TABLE IF NOT EXISTS \"consultations\" (\n  \"id\" serial,\n  \"full_name\" varchar,\n  \"email\" varchar,\n  \"phone\" varchar,\n  \"date_of_birth\" varchar,\n  \"product_slug\" varchar,\n  \"dose\" varchar,\n  \"answers\" jsonb,\n  \"status\" \"enum_consultations_status\" DEFAULT 'submitted'::enum_consultations_status NOT NULL,\n  \"user_id\" integer,\n  \"hubspot_object_id\" varchar,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"full_name\" varchar",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"email\" varchar",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"phone\" varchar",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"date_of_birth\" varchar",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"product_slug\" varchar",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"dose\" varchar",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"answers\" jsonb",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"status\" \"enum_consultations_status\" DEFAULT 'submitted'::enum_consultations_status NOT NULL",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"user_id\" integer",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"hubspot_object_id\" varchar",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"consultations\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE INDEX IF NOT EXISTS consultations_user_idx ON public.consultations USING btree (user_id)",
  "CREATE INDEX IF NOT EXISTS consultations_hubspot_object_id_idx ON public.consultations USING btree (hubspot_object_id)",
  "CREATE INDEX IF NOT EXISTS consultations_updated_at_idx ON public.consultations USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS consultations_created_at_idx ON public.consultations USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"discounts\" (\n  \"id\" serial,\n  \"code\" varchar NOT NULL,\n  \"type\" \"enum_discounts_type\" DEFAULT 'percentage'::enum_discounts_type NOT NULL,\n  \"value\" numeric NOT NULL,\n  \"expiry_date\" timestamptz,\n  \"usage_limit\" numeric,\n  \"usage_count\" numeric DEFAULT 0,\n  \"is_active\" boolean DEFAULT true,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"code\" varchar",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"type\" \"enum_discounts_type\" DEFAULT 'percentage'::enum_discounts_type NOT NULL",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"value\" numeric",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"expiry_date\" timestamptz",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"usage_limit\" numeric",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"usage_count\" numeric DEFAULT 0",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"is_active\" boolean DEFAULT true",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"discounts\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE UNIQUE INDEX IF NOT EXISTS discounts_code_idx ON public.discounts USING btree (code)",
  "CREATE INDEX IF NOT EXISTS discounts_updated_at_idx ON public.discounts USING btree (updated_at)",
  // Abandoned carts — true cart-abandonment capture for the Abandoned Checkout
  // queue + automated reminder emails. Not a Payload collection (managed via
  // raw SQL like the rest of the admin surfaces).
  "CREATE TABLE IF NOT EXISTS \"abandoned_carts\" (\n  \"id\" serial,\n  \"email\" varchar NOT NULL,\n  \"customer_name\" varchar,\n  \"phone\" varchar,\n  \"items_json\" jsonb,\n  \"total_amount\" numeric,\n  \"source\" varchar,\n  \"recovered_at\" timestamptz,\n  \"last_reminded_at\" timestamptz,\n  \"reminder_count\" integer DEFAULT 0,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "CREATE UNIQUE INDEX IF NOT EXISTS abandoned_carts_email_idx ON public.abandoned_carts USING btree (LOWER(email))",
  "CREATE INDEX IF NOT EXISTS abandoned_carts_recovered_idx ON public.abandoned_carts USING btree (recovered_at)",
  // Sequential order numbers for the new site: JL3000, JL3001, … Starting at
  // 3000 keeps them clear of the legacy/Shopify JL2xxx range so every JL3000+
  // number is a new-site order. Same number shows in the admin and all emails.
  "CREATE SEQUENCE IF NOT EXISTS \"orders_jl_seq\" START WITH 3000 INCREMENT BY 1 MINVALUE 3000",
  "CREATE INDEX IF NOT EXISTS discounts_created_at_idx ON public.discounts USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"media\" (\n  \"id\" serial,\n  \"alt\" varchar NOT NULL,\n  \"caption\" varchar,\n  \"url\" varchar NOT NULL,\n  \"filename\" varchar,\n  \"mime_type\" varchar,\n  \"filesize\" numeric,\n  \"width\" numeric,\n  \"height\" numeric,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"alt\" varchar",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"caption\" varchar",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"url\" varchar",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"filename\" varchar",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"mime_type\" varchar",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"filesize\" numeric",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"width\" numeric",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"height\" numeric",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"media\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE INDEX IF NOT EXISTS media_updated_at_idx ON public.media USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS media_created_at_idx ON public.media USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"orders\" (\n  \"id\" serial,\n  \"order_number\" varchar,\n  \"customer_name\" varchar,\n  \"customer_email\" varchar,\n  \"customer_phone\" varchar,\n  \"user_id\" integer,\n  \"shipping_address\" varchar,\n  \"items_json\" jsonb,\n  \"total_amount\" numeric NOT NULL,\n  \"discount_amount\" numeric DEFAULT 0,\n  \"payment_method\" \"enum_orders_payment_method\" DEFAULT 'test'::enum_orders_payment_method NOT NULL,\n  \"status\" \"enum_orders_status\" DEFAULT 'pending'::enum_orders_status NOT NULL,\n  \"notes\" varchar,\n  \"hubspot_deal_id\" varchar,\n  \"stripe_payment_intent_id\" varchar,\n  \"stripe_session_id\" varchar,\n  \"stripe_customer_id\" varchar,\n  \"payment_status\" \"enum_orders_payment_status\" DEFAULT 'unpaid'::enum_orders_payment_status,\n  \"ip_address\" varchar,\n  \"user_agent\" varchar,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"order_number\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"customer_name\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"customer_email\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"customer_phone\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"user_id\" integer",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"shipping_address\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"items_json\" jsonb",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"total_amount\" numeric",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"discount_amount\" numeric DEFAULT 0",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"payment_method\" \"enum_orders_payment_method\" DEFAULT 'test'::enum_orders_payment_method NOT NULL",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"status\" \"enum_orders_status\" DEFAULT 'pending'::enum_orders_status NOT NULL",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"notes\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"admin_comments\" jsonb",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"hubspot_deal_id\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"stripe_payment_intent_id\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"stripe_session_id\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"stripe_customer_id\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"payment_status\" \"enum_orders_payment_status\" DEFAULT 'unpaid'::enum_orders_payment_status",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"ip_address\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"user_agent\" varchar",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"orders\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders USING btree (order_number)",
  "CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders USING btree (user_id)",
  "CREATE INDEX IF NOT EXISTS orders_hubspot_deal_id_idx ON public.orders USING btree (hubspot_deal_id)",
  "CREATE INDEX IF NOT EXISTS orders_stripe_payment_intent_id_idx ON public.orders USING btree (stripe_payment_intent_id)",
  "CREATE INDEX IF NOT EXISTS orders_stripe_session_id_idx ON public.orders USING btree (stripe_session_id)",
  "CREATE INDEX IF NOT EXISTS orders_stripe_customer_id_idx ON public.orders USING btree (stripe_customer_id)",
  "CREATE INDEX IF NOT EXISTS orders_updated_at_idx ON public.orders USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"payload_kv\" (\n  \"id\" serial,\n  \"key\" varchar NOT NULL,\n  \"data\" jsonb NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"payload_kv\" ADD COLUMN IF NOT EXISTS \"key\" varchar",
  "ALTER TABLE \"payload_kv\" ADD COLUMN IF NOT EXISTS \"data\" jsonb",
  "CREATE UNIQUE INDEX IF NOT EXISTS payload_kv_key_idx ON public.payload_kv USING btree (key)",
  "CREATE TABLE IF NOT EXISTS \"payload_locked_documents\" (\n  \"id\" serial,\n  \"global_slug\" varchar,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"payload_locked_documents\" ADD COLUMN IF NOT EXISTS \"global_slug\" varchar",
  "ALTER TABLE \"payload_locked_documents\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"payload_locked_documents\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_global_slug_idx ON public.payload_locked_documents USING btree (global_slug)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_updated_at_idx ON public.payload_locked_documents USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_created_at_idx ON public.payload_locked_documents USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"payload_locked_documents_rels\" (\n  \"id\" serial,\n  \"order\" integer,\n  \"parent_id\" integer NOT NULL,\n  \"path\" varchar NOT NULL,\n  \"users_id\" integer,\n  \"products_id\" integer,\n  \"orders_id\" integer,\n  \"discounts_id\" integer,\n  \"media_id\" integer,\n  \"consultations_id\" integer,\n  \"posts_id\" integer,\n  \"weight_logs_id\" integer,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"order\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"parent_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"path\" varchar",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"users_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"products_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"orders_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"discounts_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"media_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"consultations_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"posts_id\" integer",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"weight_logs_id\" integer",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_order_idx ON public.payload_locked_documents_rels USING btree (\"order\")",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_parent_idx ON public.payload_locked_documents_rels USING btree (parent_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_path_idx ON public.payload_locked_documents_rels USING btree (path)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_users_id_idx ON public.payload_locked_documents_rels USING btree (users_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_products_id_idx ON public.payload_locked_documents_rels USING btree (products_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_orders_id_idx ON public.payload_locked_documents_rels USING btree (orders_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_discounts_id_idx ON public.payload_locked_documents_rels USING btree (discounts_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_media_id_idx ON public.payload_locked_documents_rels USING btree (media_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_consultations_id_idx ON public.payload_locked_documents_rels USING btree (consultations_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_posts_id_idx ON public.payload_locked_documents_rels USING btree (posts_id)",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_weight_logs_id_idx ON public.payload_locked_documents_rels USING btree (weight_logs_id)",
  "CREATE TABLE IF NOT EXISTS \"payload_migrations\" (\n  \"id\" serial,\n  \"name\" varchar,\n  \"batch\" numeric,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"payload_migrations\" ADD COLUMN IF NOT EXISTS \"name\" varchar",
  "ALTER TABLE \"payload_migrations\" ADD COLUMN IF NOT EXISTS \"batch\" numeric",
  "ALTER TABLE \"payload_migrations\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"payload_migrations\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE INDEX IF NOT EXISTS payload_migrations_updated_at_idx ON public.payload_migrations USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS payload_migrations_created_at_idx ON public.payload_migrations USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"payload_preferences\" (\n  \"id\" serial,\n  \"key\" varchar,\n  \"value\" jsonb,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"payload_preferences\" ADD COLUMN IF NOT EXISTS \"key\" varchar",
  "ALTER TABLE \"payload_preferences\" ADD COLUMN IF NOT EXISTS \"value\" jsonb",
  "ALTER TABLE \"payload_preferences\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"payload_preferences\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE INDEX IF NOT EXISTS payload_preferences_key_idx ON public.payload_preferences USING btree (key)",
  "CREATE INDEX IF NOT EXISTS payload_preferences_updated_at_idx ON public.payload_preferences USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS payload_preferences_created_at_idx ON public.payload_preferences USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"payload_preferences_rels\" (\n  \"id\" serial,\n  \"order\" integer,\n  \"parent_id\" integer NOT NULL,\n  \"path\" varchar NOT NULL,\n  \"users_id\" integer,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"payload_preferences_rels\" ADD COLUMN IF NOT EXISTS \"order\" integer",
  "ALTER TABLE \"payload_preferences_rels\" ADD COLUMN IF NOT EXISTS \"parent_id\" integer",
  "ALTER TABLE \"payload_preferences_rels\" ADD COLUMN IF NOT EXISTS \"path\" varchar",
  "ALTER TABLE \"payload_preferences_rels\" ADD COLUMN IF NOT EXISTS \"users_id\" integer",
  "CREATE INDEX IF NOT EXISTS payload_preferences_rels_order_idx ON public.payload_preferences_rels USING btree (\"order\")",
  "CREATE INDEX IF NOT EXISTS payload_preferences_rels_parent_idx ON public.payload_preferences_rels USING btree (parent_id)",
  "CREATE INDEX IF NOT EXISTS payload_preferences_rels_path_idx ON public.payload_preferences_rels USING btree (path)",
  "CREATE INDEX IF NOT EXISTS payload_preferences_rels_users_id_idx ON public.payload_preferences_rels USING btree (users_id)",
  "CREATE TABLE IF NOT EXISTS \"posts\" (\n  \"id\" serial,\n  \"title\" varchar NOT NULL,\n  \"slug\" varchar NOT NULL,\n  \"excerpt\" varchar,\n  \"hero_image_id\" integer,\n  \"content\" jsonb,\n  \"category\" \"enum_posts_category\" DEFAULT 'weight-loss'::enum_posts_category,\n  \"author_id\" integer,\n  \"status\" \"enum_posts_status\" DEFAULT 'draft'::enum_posts_status NOT NULL,\n  \"published_at\" timestamptz,\n  \"body_html\" varchar,\n  \"hero_image_url\" varchar,\n  \"shopify_article_id\" varchar,\n  \"meta_title\" varchar,\n  \"meta_description\" varchar,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"title\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"slug\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"excerpt\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"hero_image_id\" integer",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"content\" jsonb",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"category\" \"enum_posts_category\" DEFAULT 'weight-loss'::enum_posts_category",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"author_id\" integer",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"status\" \"enum_posts_status\" DEFAULT 'draft'::enum_posts_status NOT NULL",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"published_at\" timestamptz",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"body_html\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"hero_image_url\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"shopify_article_id\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"meta_title\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"meta_description\" varchar",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"posts\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE UNIQUE INDEX IF NOT EXISTS posts_slug_idx ON public.posts USING btree (slug)",
  "CREATE INDEX IF NOT EXISTS posts_hero_image_idx ON public.posts USING btree (hero_image_id)",
  "CREATE INDEX IF NOT EXISTS posts_author_idx ON public.posts USING btree (author_id)",
  "CREATE UNIQUE INDEX IF NOT EXISTS posts_shopify_article_id_idx ON public.posts USING btree (shopify_article_id)",
  "CREATE INDEX IF NOT EXISTS posts_updated_at_idx ON public.posts USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts USING btree (created_at)",
  // ---- pages (editable site pages rendered at /<slug>) ----
  "DO $$ BEGIN CREATE TYPE \"enum_pages_status\" AS ENUM ('draft','published'); EXCEPTION WHEN duplicate_object THEN null; END $$",
  "CREATE TABLE IF NOT EXISTS \"pages\" (\n  \"id\" serial,\n  \"title\" varchar NOT NULL,\n  \"slug\" varchar NOT NULL,\n  \"excerpt\" varchar,\n  \"hero_image_id\" integer,\n  \"content\" jsonb,\n  \"status\" \"enum_pages_status\" DEFAULT 'draft'::enum_pages_status NOT NULL,\n  \"published_at\" timestamptz,\n  \"body_html\" varchar,\n  \"meta_title\" varchar,\n  \"meta_description\" varchar,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"title\" varchar",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"slug\" varchar",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"excerpt\" varchar",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"hero_image_id\" integer",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"content\" jsonb",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"status\" \"enum_pages_status\" DEFAULT 'draft'::enum_pages_status NOT NULL",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"published_at\" timestamptz",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"body_html\" varchar",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"meta_title\" varchar",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"meta_description\" varchar",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"pages\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_idx ON public.pages USING btree (slug)",
  "CREATE INDEX IF NOT EXISTS pages_hero_image_idx ON public.pages USING btree (hero_image_id)",
  "CREATE INDEX IF NOT EXISTS pages_updated_at_idx ON public.pages USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS pages_created_at_idx ON public.pages USING btree (created_at)",
  // ---- globals: header / footer (site chrome, editable from /cms) ----
  "CREATE TABLE IF NOT EXISTS \"header\" (\"id\" serial, \"nav_links\" jsonb, \"updated_at\" timestamptz, \"created_at\" timestamptz, PRIMARY KEY (\"id\"))",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"nav_links\" jsonb",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"mega_heading\" varchar",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"mega_treatments\" jsonb",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"mega_promo_title\" varchar",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"mega_promo_emphasis\" varchar",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"mega_promo_bullets\" jsonb",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"mega_promo_cta\" varchar",
  "ALTER TABLE \"header\" ADD COLUMN IF NOT EXISTS \"mega_promo_href\" varchar",
  "CREATE TABLE IF NOT EXISTS \"footer\" (\"id\" serial, \"jood_links\" jsonb, \"treatment_links\" jsonb, \"policy_links\" jsonb, \"contact_heading\" varchar, \"phone\" varchar, \"email\" varchar, \"newsletter_heading\" varchar, \"newsletter_subtext\" varchar, \"legal_text\" varchar, \"updated_at\" timestamptz, \"created_at\" timestamptz, PRIMARY KEY (\"id\"))",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"jood_links\" jsonb",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"treatment_links\" jsonb",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"policy_links\" jsonb",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"contact_heading\" varchar",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"phone\" varchar",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"email\" varchar",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"newsletter_heading\" varchar",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"newsletter_subtext\" varchar",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"legal_text\" varchar",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz",
  "ALTER TABLE \"footer\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz",
  "CREATE TABLE IF NOT EXISTS \"posts_tags\" (\n  \"_order\" integer NOT NULL,\n  \"_parent_id\" integer NOT NULL,\n  \"id\" varchar NOT NULL,\n  \"tag\" varchar NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"posts_tags\" ADD COLUMN IF NOT EXISTS \"_order\" integer",
  "ALTER TABLE \"posts_tags\" ADD COLUMN IF NOT EXISTS \"_parent_id\" integer",
  "ALTER TABLE \"posts_tags\" ADD COLUMN IF NOT EXISTS \"tag\" varchar",
  "CREATE INDEX IF NOT EXISTS posts_tags_order_idx ON public.posts_tags USING btree (_order)",
  "CREATE INDEX IF NOT EXISTS posts_tags_parent_id_idx ON public.posts_tags USING btree (_parent_id)",
  "CREATE TABLE IF NOT EXISTS \"products\" (\n  \"id\" serial,\n  \"title\" varchar NOT NULL,\n  \"slug\" varchar NOT NULL,\n  \"tagline\" varchar,\n  \"card_copy\" varchar,\n  \"description\" varchar NOT NULL,\n  \"category\" \"enum_products_category\" DEFAULT 'medication'::enum_products_category NOT NULL,\n  \"treatment\" \"enum_products_treatment\",\n  \"tag\" varchar,\n  \"from_price\" numeric,\n  \"compare_price\" numeric,\n  \"subscription_price\" numeric,\n  \"display_order\" numeric DEFAULT 100,\n  \"badge\" varchar,\n  \"footer_color\" varchar DEFAULT '#142e2a'::character varying,\n  \"rating_value\" numeric,\n  \"rating_count\" numeric,\n  \"hero_image_url\" varchar,\n  \"gallery_image_urls\" jsonb,\n  \"variants_json\" jsonb,\n  \"is_active\" boolean DEFAULT true,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"title\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"slug\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"tagline\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"card_copy\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"description\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"category\" \"enum_products_category\" DEFAULT 'medication'::enum_products_category NOT NULL",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"treatment\" \"enum_products_treatment\"",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"tag\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"from_price\" numeric",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"compare_price\" numeric",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"subscription_price\" numeric",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"display_order\" numeric DEFAULT 100",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"badge\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"footer_color\" varchar DEFAULT '#142e2a'::character varying",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"rating_value\" numeric",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"rating_count\" numeric",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"hero_image_url\" varchar",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"gallery_image_urls\" jsonb",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"variants_json\" jsonb",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"is_active\" boolean DEFAULT true",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"products\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON public.products USING btree (slug)",
  "CREATE INDEX IF NOT EXISTS products_updated_at_idx ON public.products USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS products_created_at_idx ON public.products USING btree (created_at)",
  "CREATE TABLE IF NOT EXISTS \"products_images\" (\n  \"_order\" integer NOT NULL,\n  \"_parent_id\" integer NOT NULL,\n  \"id\" varchar NOT NULL,\n  \"image_id\" integer NOT NULL,\n  \"alt\" varchar,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"products_images\" ADD COLUMN IF NOT EXISTS \"_order\" integer",
  "ALTER TABLE \"products_images\" ADD COLUMN IF NOT EXISTS \"_parent_id\" integer",
  "ALTER TABLE \"products_images\" ADD COLUMN IF NOT EXISTS \"image_id\" integer",
  "ALTER TABLE \"products_images\" ADD COLUMN IF NOT EXISTS \"alt\" varchar",
  "CREATE INDEX IF NOT EXISTS products_images_order_idx ON public.products_images USING btree (_order)",
  "CREATE INDEX IF NOT EXISTS products_images_parent_id_idx ON public.products_images USING btree (_parent_id)",
  "CREATE INDEX IF NOT EXISTS products_images_image_idx ON public.products_images USING btree (image_id)",
  "CREATE TABLE IF NOT EXISTS \"products_variants\" (\n  \"_order\" integer NOT NULL,\n  \"_parent_id\" integer NOT NULL,\n  \"id\" varchar NOT NULL,\n  \"label\" varchar NOT NULL,\n  \"size\" varchar,\n  \"color\" varchar,\n  \"price\" numeric NOT NULL,\n  \"compare_price\" numeric,\n  \"sku\" varchar,\n  \"stock\" numeric DEFAULT 0,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"_order\" integer",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"_parent_id\" integer",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"label\" varchar",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"size\" varchar",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"color\" varchar",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"price\" numeric",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"compare_price\" numeric",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"sku\" varchar",
  "ALTER TABLE \"products_variants\" ADD COLUMN IF NOT EXISTS \"stock\" numeric DEFAULT 0",
  "CREATE INDEX IF NOT EXISTS products_variants_order_idx ON public.products_variants USING btree (_order)",
  "CREATE INDEX IF NOT EXISTS products_variants_parent_id_idx ON public.products_variants USING btree (_parent_id)",
  "CREATE TABLE IF NOT EXISTS \"users\" (\n  \"id\" serial,\n  \"name\" varchar NOT NULL,\n  \"phone\" varchar,\n  \"avatar_id\" integer,\n  \"role\" \"enum_users_role\" DEFAULT 'customer'::enum_users_role NOT NULL,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  \"email\" varchar NOT NULL,\n  \"reset_password_token\" varchar,\n  \"reset_password_expiration\" timestamptz,\n  \"salt\" varchar,\n  \"hash\" varchar,\n  \"login_attempts\" numeric DEFAULT 0,\n  \"lock_until\" timestamptz,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"name\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"phone\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"avatar_id\" integer",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"role\" \"enum_users_role\" DEFAULT 'customer'::enum_users_role NOT NULL",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"email\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"reset_password_token\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"reset_password_expiration\" timestamptz",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"salt\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"hash\" varchar",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"login_attempts\" numeric DEFAULT 0",
  "ALTER TABLE \"users\" ADD COLUMN IF NOT EXISTS \"lock_until\" timestamptz",
  "CREATE INDEX IF NOT EXISTS users_avatar_idx ON public.users USING btree (avatar_id)",
  "CREATE INDEX IF NOT EXISTS users_updated_at_idx ON public.users USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS users_created_at_idx ON public.users USING btree (created_at)",
  "CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users USING btree (email)",
  "CREATE TABLE IF NOT EXISTS \"users_sessions\" (\n  \"_order\" integer NOT NULL,\n  \"_parent_id\" integer NOT NULL,\n  \"id\" varchar NOT NULL,\n  \"created_at\" timestamptz,\n  \"expires_at\" timestamptz NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"users_sessions\" ADD COLUMN IF NOT EXISTS \"_order\" integer",
  "ALTER TABLE \"users_sessions\" ADD COLUMN IF NOT EXISTS \"_parent_id\" integer",
  "ALTER TABLE \"users_sessions\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz",
  "ALTER TABLE \"users_sessions\" ADD COLUMN IF NOT EXISTS \"expires_at\" timestamptz",
  "CREATE INDEX IF NOT EXISTS users_sessions_order_idx ON public.users_sessions USING btree (_order)",
  "CREATE INDEX IF NOT EXISTS users_sessions_parent_id_idx ON public.users_sessions USING btree (_parent_id)",
  "CREATE TABLE IF NOT EXISTS \"weight_logs\" (\n  \"id\" serial,\n  \"user_id\" integer NOT NULL,\n  \"customer_email\" varchar NOT NULL,\n  \"weight_kg\" numeric NOT NULL,\n  \"logged_at\" timestamptz NOT NULL,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"weight_logs\" ADD COLUMN IF NOT EXISTS \"user_id\" integer",
  "ALTER TABLE \"weight_logs\" ADD COLUMN IF NOT EXISTS \"customer_email\" varchar",
  "ALTER TABLE \"weight_logs\" ADD COLUMN IF NOT EXISTS \"weight_kg\" numeric",
  "ALTER TABLE \"weight_logs\" ADD COLUMN IF NOT EXISTS \"logged_at\" timestamptz",
  "ALTER TABLE \"weight_logs\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"weight_logs\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE INDEX IF NOT EXISTS weight_logs_user_idx ON public.weight_logs USING btree (user_id)",
  "CREATE INDEX IF NOT EXISTS weight_logs_customer_email_idx ON public.weight_logs USING btree (customer_email)",
  "CREATE INDEX IF NOT EXISTS weight_logs_updated_at_idx ON public.weight_logs USING btree (updated_at)",
  "CREATE INDEX IF NOT EXISTS weight_logs_created_at_idx ON public.weight_logs USING btree (created_at)",
  // Inventory — pharmacy stock batches.
  "CREATE TABLE IF NOT EXISTS \"inventory\" (\n  \"id\" serial,\n  \"medicine_name\" varchar NOT NULL,\n  \"batch_number\" varchar NOT NULL,\n  \"batch_quantity\" numeric NOT NULL,\n  \"expiry_date\" timestamptz NOT NULL,\n  \"updated_at\" timestamptz DEFAULT now() NOT NULL,\n  \"created_at\" timestamptz DEFAULT now() NOT NULL,\n  PRIMARY KEY (\"id\")\n)",
  "ALTER TABLE \"inventory\" ADD COLUMN IF NOT EXISTS \"medicine_name\" varchar",
  "ALTER TABLE \"inventory\" ADD COLUMN IF NOT EXISTS \"batch_number\" varchar",
  "ALTER TABLE \"inventory\" ADD COLUMN IF NOT EXISTS \"batch_quantity\" numeric",
  "ALTER TABLE \"inventory\" ADD COLUMN IF NOT EXISTS \"expiry_date\" timestamptz",
  "ALTER TABLE \"inventory\" ADD COLUMN IF NOT EXISTS \"updated_at\" timestamptz DEFAULT now() NOT NULL",
  "ALTER TABLE \"inventory\" ADD COLUMN IF NOT EXISTS \"created_at\" timestamptz DEFAULT now() NOT NULL",
  "CREATE INDEX IF NOT EXISTS inventory_medicine_name_idx ON public.inventory USING btree (medicine_name)",
  "CREATE INDEX IF NOT EXISTS inventory_batch_number_idx ON public.inventory USING btree (batch_number)",
  "CREATE INDEX IF NOT EXISTS inventory_created_at_idx ON public.inventory USING btree (created_at)",
  "ALTER TABLE \"payload_locked_documents_rels\" ADD COLUMN IF NOT EXISTS \"inventory_id\" integer",
  "CREATE INDEX IF NOT EXISTS payload_locked_documents_rels_inventory_id_idx ON public.payload_locked_documents_rels USING btree (inventory_id)",
  // Seed a starter discount code (WELCOME20 → 20% off) once. Idempotent: only
  // inserts when absent, so editing/disabling it in the dashboard sticks. To
  // retire it, set it inactive in the admin rather than deleting the row.
  "INSERT INTO \"discounts\" (\"code\", \"type\", \"value\", \"usage_count\", \"is_active\", \"updated_at\", \"created_at\") SELECT 'WELCOME20', 'percentage'::enum_discounts_type, 20, 0, true, now(), now() WHERE NOT EXISTS (SELECT 1 FROM \"discounts\" WHERE upper(\"code\") = 'WELCOME20')"
];

let ensured = false;

/**
 * Bump this whenever STATEMENTS changes. The full DDL list only runs when the
 * version stored in the database differs — otherwise boot does ONE fast
 * lookup instead of ~100 sequential statements. That repair loop used to run
 * on every cold start, adding several seconds before the first request
 * (users saw login "taking forever" after the site had been idle).
 */
const SCHEMA_VERSION = "v7";

export async function ensureFullSchema(payload: Payload): Promise<void> {
  if (ensured) return;
  const drizzle = (
    payload.db as unknown as {
      drizzle?: { execute?: (q: unknown) => Promise<unknown> };
    }
  ).drizzle as { execute: (q: unknown) => Promise<unknown> } | undefined;
  if (!drizzle?.execute) return;
  const { sql } = (await import("drizzle-orm")) as {
    sql: { raw: (s: string) => unknown };
  };
  const asRows = (x: unknown): Array<Record<string, unknown>> => {
    if (Array.isArray(x)) return x as Array<Record<string, unknown>>;
    const r = (x as { rows?: Array<Record<string, unknown>> })?.rows;
    return Array.isArray(r) ? r : [];
  };

  // Fast path: if the stored schema version matches, the repair already ran —
  // skip the whole statement list (one ~30ms query instead of seconds).
  try {
    const res = await drizzle.execute(
      sql.raw(
        `SELECT value FROM "app_schema_meta" WHERE key = 'schema_version' LIMIT 1`,
      ),
    );
    const current = String(asRows(res)[0]?.value ?? "");
    if (current === SCHEMA_VERSION) {
      ensured = true;
      return;
    }
  } catch {
    /* meta table missing — first run; fall through to the full repair */
  }

  let failures = 0;
  for (const stmt of STATEMENTS) {
    try {
      await drizzle.execute(sql.raw(stmt));
    } catch (err) {
      failures++;
      payload.logger?.error?.({
        msg: "ensureFullSchema statement failed",
        stmt: stmt.slice(0, 120),
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
  if (failures) {
    payload.logger?.warn?.(`ensureFullSchema: ${failures}/${STATEMENTS.length} statements failed (non-fatal)`);
  }

  // Record the version so subsequent boots take the fast path. Only when the
  // full list ran cleanly — failures mean the repair should retry next boot.
  if (failures === 0) {
    try {
      await drizzle.execute(
        sql.raw(
          `CREATE TABLE IF NOT EXISTS "app_schema_meta" (key varchar PRIMARY KEY, value varchar NOT NULL)`,
        ),
      );
      await drizzle.execute(
        sql.raw(
          `INSERT INTO "app_schema_meta" (key, value) VALUES ('schema_version', '${SCHEMA_VERSION}')
           ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ),
      );
    } catch (err) {
      payload.logger?.warn?.({
        msg: "ensureFullSchema: could not persist schema version (repair will re-run next boot)",
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
  ensured = true;
}
