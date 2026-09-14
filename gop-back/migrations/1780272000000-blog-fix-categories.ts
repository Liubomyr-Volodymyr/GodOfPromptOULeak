import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogFixCategories1780272000000 implements MigrationInterface {
	name = 'BlogFixCategories1780272000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add SEO fields to categories (shared by prompt library + blog)
		await queryRunner.query(`
			ALTER TABLE "categories"
				ADD COLUMN IF NOT EXISTS "meta_title"       varchar,
				ADD COLUMN IF NOT EXISTS "meta_description" text,
				ADD COLUMN IF NOT EXISTS "seo_body_html"    text,
				ADD COLUMN IF NOT EXISTS "og_image_url"     varchar,
				ADD COLUMN IF NOT EXISTS "canonical_url"    varchar,
				ADD COLUMN IF NOT EXISTS "seo_status"       "seo_status_enum" NOT NULL DEFAULT 'pending',
				ADD COLUMN IF NOT EXISTS "sort_order"       integer NOT NULL DEFAULT 0
		`);

		// Replace blog_category_id (UUID → blog_categories) with category_id (int → categories)
		await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "blog_category_id"`);
		await queryRunner.query(`
			ALTER TABLE "posts"
				ADD COLUMN "category_id" integer REFERENCES "categories"("id") ON DELETE SET NULL
		`);
		await queryRunner.query(`CREATE INDEX "IDX_posts_category_id" ON "posts" ("category_id")`);

		// Drop blog_categories — categories table now handles both surfaces
		await queryRunner.query(`DROP TABLE IF EXISTS "blog_categories"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_posts_category_id"`);
		await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN IF EXISTS "category_id"`);

		await queryRunner.query(`
			CREATE TABLE "blog_categories" (
				"id"   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
				"slug" varchar NOT NULL,
				"name" varchar NOT NULL,
				CONSTRAINT "UQ_blog_categories_slug" UNIQUE ("slug")
			)
		`);
		await queryRunner.query(`
			ALTER TABLE "posts"
				ADD COLUMN "blog_category_id" uuid REFERENCES "blog_categories"("id") ON DELETE SET NULL
		`);

		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "sort_order"`);
		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_status"`);
		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "canonical_url"`);
		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "og_image_url"`);
		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "seo_body_html"`);
		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "meta_description"`);
		await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN IF EXISTS "meta_title"`);
	}
}
