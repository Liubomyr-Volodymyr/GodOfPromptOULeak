import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogRenameExtend1780617600000 implements MigrationInterface {
	name = 'BlogRenameExtend1780617600000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// ── Rename tables to the blog_* namespace ────────────────────────────
		await queryRunner.query(`ALTER TABLE IF EXISTS "posts"                 RENAME TO "blog_posts"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "tags"                  RENAME TO "blog_tags"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "posts_tags"            RENAME TO "blog_post_tags"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "posts_tools"           RENAME TO "blog_post_tools"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "posts_audience_types"  RENAME TO "blog_post_audiences"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "redirects"             RENAME TO "blog_redirects"`);

		// ── Rename / retype columns ──────────────────────────────────────────
		await queryRunner.query(`ALTER TABLE "blog_post_audiences" RENAME COLUMN "audience_type_id" TO "audience_id"`);

		await queryRunner.query(`ALTER TABLE "blog_redirects" RENAME COLUMN "status_code" TO "status"`);
		await queryRunner.query(`ALTER TABLE "blog_redirects" ALTER COLUMN "status" TYPE smallint`);
		await queryRunner.query(`ALTER TABLE "blog_redirects" ALTER COLUMN "from_path" TYPE text`);
		await queryRunner.query(`ALTER TABLE "blog_redirects" ALTER COLUMN "to_path"   TYPE text`);
		await queryRunner.query(`ALTER TABLE "blog_redirects" ALTER COLUMN "created_at" TYPE timestamptz`);
		await queryRunner.query(`
			ALTER TABLE "blog_redirects"
				ADD CONSTRAINT "blog_redirects_status_chk" CHECK ("status" IN (301, 302, 308))
		`);

		// ── New columns on blog_posts ────────────────────────────────────────
		await queryRunner.query(`
			ALTER TABLE "blog_posts"
				ADD COLUMN IF NOT EXISTS "seo_index"     boolean NOT NULL DEFAULT true,
				ADD COLUMN IF NOT EXISTS "keywords"      text[],
				ADD COLUMN IF NOT EXISTS "metadata"      jsonb,
				ADD COLUMN IF NOT EXISTS "search_vector" tsvector
		`);

		// ── New M:N join tables (shared taxonomy: prompts uuid, products uuid) ─
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "blog_post_prompts" (
				"post_id"   uuid     NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
				"prompt_id" uuid     NOT NULL REFERENCES "prompts"("id")    ON DELETE CASCADE,
				"position"  smallint,
				PRIMARY KEY ("post_id", "prompt_id")
			)
		`);
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "blog_post_products" (
				"post_id"    uuid NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
				"product_id" uuid NOT NULL REFERENCES "products"("id")   ON DELETE CASCADE,
				"placement"  text CHECK ("placement" IS NULL OR "placement" IN ('inline','sidebar','footer')),
				PRIMARY KEY ("post_id", "product_id")
			)
		`);

		// ── Drop removed features ────────────────────────────────────────────
		await queryRunner.query(`DROP TABLE IF EXISTS "posts_related"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "content_links"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "post_revisions"`);

		// ── Indexes ──────────────────────────────────────────────────────────
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_feed"`);
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS "blog_posts_feed_idx"
				ON "blog_posts" ("published_at" DESC) WHERE "status" = 'published' AND "seo_index"
		`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_posts_search_idx"   ON "blog_posts" USING gin ("search_vector")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_posts_keywords_idx" ON "blog_posts" USING gin ("keywords")`);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "blog_posts_metadata_idx" ON "blog_posts" USING gin ("metadata" jsonb_path_ops)`,
		);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_posts_category_idx" ON "blog_posts" ("category_id")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_posts_author_idx"   ON "blog_posts" ("author_id")`);

		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_post_tags_tag_idx"         ON "blog_post_tags" ("tag_id")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_post_tools_tool_idx"       ON "blog_post_tools" ("tool_id")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_post_audiences_aud_idx"    ON "blog_post_audiences" ("audience_id")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_post_prompts_prompt_idx"   ON "blog_post_prompts" ("prompt_id")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "blog_post_products_product_idx" ON "blog_post_products" ("product_id")`);

		// ── updated_at trigger ───────────────────────────────────────────────
		await queryRunner.query(`
			CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
			BEGIN NEW.updated_at = now(); RETURN NEW; END;
			$$ LANGUAGE plpgsql
		`);
		await queryRunner.query(`DROP TRIGGER IF EXISTS "blog_posts_touch" ON "blog_posts"`);
		await queryRunner.query(`
			CREATE TRIGGER "blog_posts_touch" BEFORE UPDATE ON "blog_posts"
				FOR EACH ROW EXECUTE FUNCTION touch_updated_at()
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TRIGGER IF EXISTS "blog_posts_touch" ON "blog_posts"`);
		await queryRunner.query(`DROP FUNCTION IF EXISTS touch_updated_at()`);

		await queryRunner.query(`DROP INDEX IF EXISTS "blog_post_products_product_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_post_prompts_prompt_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_post_audiences_aud_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_post_tools_tool_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_post_tags_tag_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_posts_author_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_posts_category_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_posts_metadata_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_posts_keywords_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_posts_search_idx"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "blog_posts_feed_idx"`);

		await queryRunner.query(`DROP TABLE IF EXISTS "blog_post_products"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "blog_post_prompts"`);

		await queryRunner.query(`
			ALTER TABLE "blog_posts"
				DROP COLUMN IF EXISTS "search_vector",
				DROP COLUMN IF EXISTS "metadata",
				DROP COLUMN IF EXISTS "keywords",
				DROP COLUMN IF EXISTS "seo_index"
		`);

		// Recreate the dropped feed index under its original name
		await queryRunner.query(`
			CREATE INDEX IF NOT EXISTS "IDX_posts_feed" ON "blog_posts" ("status", "published_at")
		`);

		await queryRunner.query(`ALTER TABLE "blog_redirects" DROP CONSTRAINT IF EXISTS "blog_redirects_status_chk"`);
		await queryRunner.query(`ALTER TABLE "blog_redirects" ALTER COLUMN "created_at" TYPE timestamp`);
		await queryRunner.query(`ALTER TABLE "blog_redirects" ALTER COLUMN "status" TYPE integer`);
		await queryRunner.query(`ALTER TABLE "blog_redirects" RENAME COLUMN "status" TO "status_code"`);

		await queryRunner.query(`ALTER TABLE "blog_post_audiences" RENAME COLUMN "audience_id" TO "audience_type_id"`);

		// Rename tables back
		await queryRunner.query(`ALTER TABLE IF EXISTS "blog_redirects"        RENAME TO "redirects"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "blog_post_audiences"   RENAME TO "posts_audience_types"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "blog_post_tools"       RENAME TO "posts_tools"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "blog_post_tags"        RENAME TO "posts_tags"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "blog_tags"             RENAME TO "tags"`);
		await queryRunner.query(`ALTER TABLE IF EXISTS "blog_posts"            RENAME TO "posts"`);

		// Recreate dropped feature tables (original definitions)
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "posts_related" (
				"post_id"         uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"related_post_id" uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"position"        int  NOT NULL DEFAULT 0,
				PRIMARY KEY ("post_id", "related_post_id")
			)
		`);
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "content_links" (
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
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "post_revisions" (
				"id"         SERIAL PRIMARY KEY,
				"post_id"    uuid NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
				"body"       text NOT NULL,
				"updated_by" varchar NOT NULL DEFAULT 'system',
				"created_at" timestamp NOT NULL DEFAULT now()
			)
		`);
	}
}
