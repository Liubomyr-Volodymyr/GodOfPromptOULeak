import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptTypes1778579296467 implements MigrationInterface {
	name = 'PromptTypes1778579296467';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" ADD "generation_cost" numeric(10,4)`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "generation_input_tokens" integer`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "generation_output_tokens" integer`);
		await queryRunner.query(`DROP INDEX "public"."idx_prompts_feed"`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "output_type_id" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_public" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_public" SET DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "date_created" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "status"`);
		await queryRunner.query(`CREATE TYPE "public"."prompts_status_enum" AS ENUM('published', 'pending')`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "status" "public"."prompts_status_enum" NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "what_this_prompt_does"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "what_this_prompt_does" text`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "tips"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "tips" text`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "description"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "description" text`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "slug" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "page_name" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "prompt_name" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "how_to_use_the_prompt"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "how_to_use_the_prompt" text`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "seo_description"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "seo_description" text`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_premium" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_premium" SET DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "input_body"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "input_body" text`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "unique_views_count" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "unique_views_count" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "bookmarks_count" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "bookmarks_count" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "prompt_body"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "prompt_body" text NOT NULL`);
		await queryRunner.query(`CREATE INDEX "idx_prompts_feed" ON "prompts" ("is_public", "status", "date_created") `);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_prompts_feed"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "prompt_body"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "prompt_body" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "bookmarks_count" SET DEFAULT '0'`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "bookmarks_count" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "unique_views_count" SET DEFAULT '0'`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "unique_views_count" SET NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "input_body"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "input_body" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_premium" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_premium" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "seo_description"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "seo_description" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "how_to_use_the_prompt"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "how_to_use_the_prompt" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "prompt_name" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "page_name" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "slug" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "description"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "description" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "tips"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "tips" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "what_this_prompt_does"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "what_this_prompt_does" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "status"`);
		await queryRunner.query(`DROP TYPE "public"."prompts_status_enum"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "status" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "date_created" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_public" DROP DEFAULT`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "is_public" DROP NOT NULL`);
		await queryRunner.query(`ALTER TABLE "prompts" ALTER COLUMN "output_type_id" DROP NOT NULL`);
		await queryRunner.query(`CREATE INDEX "idx_prompts_feed" ON "prompts" ("is_public", "date_created", "status") `);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "generation_output_tokens"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "generation_input_tokens"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "generation_cost"`);
	}
}
