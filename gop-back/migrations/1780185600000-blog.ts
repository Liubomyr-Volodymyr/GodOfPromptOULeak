import { MigrationInterface, QueryRunner } from 'typeorm';

export class Blog1780185600000 implements MigrationInterface {
	name = 'Blog1780185600000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// ── Extend authors with profile / SEO fields ──────────────────────────
		await queryRunner.query(`
			ALTER TABLE "authors"
				ADD COLUMN IF NOT EXISTS "slug"             varchar,
				ADD COLUMN IF NOT EXISTS "bio"              text,
				ADD COLUMN IF NOT EXISTS "role"             varchar,
				ADD COLUMN IF NOT EXISTS "avatar_url"       varchar,
				ADD COLUMN IF NOT EXISTS "twitter_url"      varchar,
				ADD COLUMN IF NOT EXISTS "linkedin_url"     varchar,
				ADD COLUMN IF NOT EXISTS "website_url"      varchar,
				ADD COLUMN IF NOT EXISTS "meta_title"       varchar,
				ADD COLUMN IF NOT EXISTS "meta_description" text,
				ADD COLUMN IF NOT EXISTS "og_image_url"     varchar
		`);
		await queryRunner.query(`
			CREATE UNIQUE INDEX IF NOT EXISTS "IDX_authors_slug"
				ON "authors" ("slug") WHERE "slug" IS NOT NULL
		`);

		// ── seo_status enum (shared across content types) ────────────────────
		await queryRunner.query(`
			CREATE TYPE "seo_status_enum" AS ENUM (
				'pending',
				'optimised',
				'needs_review',
				'noindex'
			)
		`);

		// ── blog_categories (9 pillars — separate from prompt `categories`) ───
		await queryRunner.query(`
			CREATE TABLE "blog_categories" (
				"id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				"slug"             varchar NOT NULL,
				"name"             varchar NOT NULL,
				"description"      text,
				"parent_id"        uuid REFERENCES "blog_categories"("id") ON DELETE SET NULL,
				"meta_title"       varchar,
				"meta_description" text,
				"canonical_url"    varchar,
				"og_image_url"     varchar,
				"seo_body_html"    text,
				"seo_status"       "seo_status_enum" NOT NULL DEFAULT 'pending',
				"sort_order"       integer NOT NULL DEFAULT 0,
				"created_at"       timestamp NOT NULL DEFAULT now(),
				"updated_at"       timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "UQ_blog_categories_slug" UNIQUE ("slug")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_blog_categories_slug"   ON "blog_categories" ("slug")`);
		await queryRunner.query(`CREATE INDEX "IDX_blog_categories_parent" ON "blog_categories" ("parent_id")`);

		// ── tags ──────────────────────────────────────────────────────────────
		await queryRunner.query(`
			CREATE TABLE "tags" (
				"id"      SERIAL PRIMARY KEY,
				"name"    varchar NOT NULL,
				"slug"    varchar NOT NULL,
				"noindex" boolean NOT NULL DEFAULT true,
				CONSTRAINT "UQ_tags_slug" UNIQUE ("slug")
			)
		`);

		// ── posts ─────────────────────────────────────────────────────────────
		await queryRunner.query(`
			CREATE TYPE "posts_status_enum" AS ENUM ('draft', 'published', 'archived')
		`);
		await queryRunner.query(`
			CREATE TABLE "posts" (
				"id"                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				"title"                varchar NOT NULL,
				"slug"                 varchar NOT NULL,
				"excerpt"              text,
				"body"                 text NOT NULL DEFAULT '',
				"cover_image_url"      varchar,
				"status"               "posts_status_enum" NOT NULL DEFAULT 'draft',
				"featured"             boolean NOT NULL DEFAULT false,
				"reading_time_minutes" integer,
				"author_id"            integer REFERENCES "authors"("id") ON DELETE SET NULL,
				"blog_category_id"     uuid    REFERENCES "blog_categories"("id") ON DELETE SET NULL,
				"seo_title"            varchar,
				"seo_description"      text,
				"canonical_url"        varchar,
				"og_image_url"         varchar,
				"seo_status"           "seo_status_enum" NOT NULL DEFAULT 'pending',
				"internal_links"       jsonb,
				"published_at"         timestamp,
				"created_at"           timestamp NOT NULL DEFAULT now(),
				"updated_at"           timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "UQ_posts_slug" UNIQUE ("slug")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_slug"             ON "posts" ("slug")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_status"           ON "posts" ("status")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_feed"             ON "posts" ("status", "published_at")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_author_id"        ON "posts" ("author_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_blog_category_id" ON "posts" ("blog_category_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_seo_status"       ON "posts" ("seo_status")`);

		// ── posts_tags ────────────────────────────────────────────────────────
		await queryRunner.query(`
			CREATE TABLE "posts_tags" (
				"post_id" uuid    NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"tag_id"  integer NOT NULL REFERENCES "tags"("id")  ON DELETE CASCADE,
				PRIMARY KEY ("post_id", "tag_id")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_tags_post_id" ON "posts_tags" ("post_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_tags_tag_id"  ON "posts_tags" ("tag_id")`);

		// ── posts_audience_types (reuse shared taxonomy) ──────────────────────
		await queryRunner.query(`
			CREATE TABLE "posts_audience_types" (
				"post_id"          uuid    NOT NULL REFERENCES "posts"("id")          ON DELETE CASCADE,
				"audience_type_id" integer NOT NULL REFERENCES "audience_types"("id") ON DELETE CASCADE,
				PRIMARY KEY ("post_id", "audience_type_id")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_audience_types_post_id"          ON "posts_audience_types" ("post_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_audience_types_audience_type_id" ON "posts_audience_types" ("audience_type_id")`);

		// ── posts_tools (reuse shared taxonomy) ──────────────────────────────
		await queryRunner.query(`
			CREATE TABLE "posts_tools" (
				"post_id" uuid    NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"tool_id" integer NOT NULL REFERENCES "tools"("id") ON DELETE CASCADE,
				PRIMARY KEY ("post_id", "tool_id")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_tools_post_id" ON "posts_tools" ("post_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_tools_tool_id" ON "posts_tools" ("tool_id")`);

		// ── posts_related ─────────────────────────────────────────────────────
		await queryRunner.query(`
			CREATE TABLE "posts_related" (
				"post_id"         uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"related_post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"position"        integer NOT NULL DEFAULT 0,
				PRIMARY KEY ("post_id", "related_post_id")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_related_post_id" ON "posts_related" ("post_id")`);

		// ── content_links (hard cross-domain joins: blog ↔ prompt-library) ───
		// from_type / to_type: 'post' | 'blog_category' | 'category' | 'tool' | 'product'
		await queryRunner.query(`
			CREATE TABLE "content_links" (
				"from_type"  varchar  NOT NULL,
				"from_id"    uuid     NOT NULL,
				"to_type"    varchar  NOT NULL,
				"to_id"      uuid     NOT NULL,
				"relation"   varchar  NOT NULL,
				"weight"     smallint NOT NULL DEFAULT 1,
				"created_at" timestamp NOT NULL DEFAULT now(),
				PRIMARY KEY ("from_type", "from_id", "to_type", "to_id", "relation")
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_content_links_to" ON "content_links" ("to_type", "to_id")`);

		// ── post_revisions (AI-update audit trail) ────────────────────────────
		await queryRunner.query(`
			CREATE TABLE "post_revisions" (
				"id"         SERIAL PRIMARY KEY,
				"post_id"    uuid    NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"body"       text    NOT NULL,
				"updated_by" varchar NOT NULL DEFAULT 'system',
				"created_at" timestamp NOT NULL DEFAULT now()
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_post_revisions_post_id" ON "post_revisions" ("post_id")`);

		// ── redirects ─────────────────────────────────────────────────────────
		await queryRunner.query(`
			CREATE TABLE "redirects" (
				"id"          SERIAL PRIMARY KEY,
				"from_path"   varchar NOT NULL,
				"to_path"     varchar NOT NULL,
				"status_code" integer NOT NULL DEFAULT 301,
				"created_at"  timestamp NOT NULL DEFAULT now(),
				CONSTRAINT "UQ_redirects_from_path" UNIQUE ("from_path")
			)
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "redirects"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "post_revisions"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "content_links"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "posts_related"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "posts_tools"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "posts_audience_types"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "posts_tags"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "posts"`);
		await queryRunner.query(`DROP TYPE  IF EXISTS "posts_status_enum"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "tags"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "blog_categories"`);
		await queryRunner.query(`DROP TYPE  IF EXISTS "seo_status_enum"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_authors_slug"`);
		await queryRunner.query(`
			ALTER TABLE "authors"
				DROP COLUMN IF EXISTS "slug",
				DROP COLUMN IF EXISTS "bio",
				DROP COLUMN IF EXISTS "role",
				DROP COLUMN IF EXISTS "avatar_url",
				DROP COLUMN IF EXISTS "twitter_url",
				DROP COLUMN IF EXISTS "linkedin_url",
				DROP COLUMN IF EXISTS "website_url",
				DROP COLUMN IF EXISTS "meta_title",
				DROP COLUMN IF EXISTS "meta_description",
				DROP COLUMN IF EXISTS "og_image_url"
		`);
	}
}
