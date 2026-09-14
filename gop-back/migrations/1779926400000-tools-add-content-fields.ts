import { MigrationInterface, QueryRunner } from 'typeorm';

export class ToolsAddContentFields1779926400000 implements MigrationInterface {
	name = 'ToolsAddContentFields1779926400000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "tools" ADD "type" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "parent_id" integer`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "title" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "h1" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "seo_description" text`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "behavior" text`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "tips" text`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "how_to_use" text`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "best_for" text`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "icon" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "hero_image_url" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "screenshot_image_url" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "pricing_model" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "pricing_summary" text`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "plb_instructions" text`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "supports_variables" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "published_at" TIMESTAMP`);
		await queryRunner.query(`ALTER TABLE "tools" ADD "last_reviewed_at" TIMESTAMP`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "last_reviewed_at"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "published_at"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "supports_variables"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "plb_instructions"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "pricing_summary"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "pricing_model"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "screenshot_image_url"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "hero_image_url"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "icon"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "best_for"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "how_to_use"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "tips"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "behavior"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "seo_description"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "h1"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "title"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "parent_id"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "type"`);
	}
}
