import { MigrationInterface, QueryRunner } from 'typeorm';

export class BlogRedesignFields1780963200000 implements MigrationInterface {
	name = 'BlogRedesignFields1780963200000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "schema_type" varchar NOT NULL DEFAULT 'Article'`);
		await queryRunner.query(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "focus_keyword" varchar`);
		await queryRunner.query(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "faq_items" jsonb`);
		await queryRunner.query(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "related_post_ids" jsonb`);
		await queryRunner.query(`ALTER TABLE "blog_posts" ADD COLUMN IF NOT EXISTS "content_updated_at" timestamp`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "content_updated_at"`);
		await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "related_post_ids"`);
		await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "faq_items"`);
		await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "focus_keyword"`);
		await queryRunner.query(`ALTER TABLE "blog_posts" DROP COLUMN IF EXISTS "schema_type"`);
	}
}
