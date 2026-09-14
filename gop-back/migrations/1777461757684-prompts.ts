import { MigrationInterface, QueryRunner } from 'typeorm';

export class Prompts1777461757684 implements MigrationInterface {
	name = 'Prompts1777461757684';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "prompt_format_recommended_tools" ("id" SERIAL NOT NULL, "prompt_format_id" integer, "recommended_tools_id" integer, CONSTRAINT "PK_24a72b478686d7323880e0e57d6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "uq_prompt_format_tool" ON "prompt_format_recommended_tools" ("prompt_format_id", "recommended_tools_id") `,
		);
		await queryRunner.query(
			`CREATE TABLE "prompt_format" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "tech_name" character varying NOT NULL, CONSTRAINT "PK_5c807b0769bc26b932aa956b739" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "uq_prompt_format_tech_name" ON "prompt_format" ("tech_name") `);
		await queryRunner.query(
			`CREATE TABLE "input_format" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "tech_name" character varying NOT NULL, CONSTRAINT "PK_bc83eea221c04493ddb187e6d56" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "idx_input_format_tech_name" ON "input_format" ("tech_name") `);
		await queryRunner.query(
			`CREATE TABLE "prompts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "output_type_id" integer, "user_folder_id" uuid, "is_public" boolean, "date_created" TIMESTAMP, "status" character varying, "example_output_image" uuid, "icon" character varying, "what_this_prompt_does" character varying, "tips" character varying, "description" character varying, "slug" character varying, "page_name" character varying, "prompt_name" character varying, "how_to_use_the_prompt" character varying, "seo_description" character varying, "is_premium" boolean, "input_body" character varying, "date_published" TIMESTAMP, "notion_page_id" character varying, "moderator_id" uuid, "likes_count" integer NOT NULL DEFAULT '0', "bookmarks_count" integer NOT NULL DEFAULT '0', "views_count" integer NOT NULL DEFAULT '0', "unique_views_count" integer NOT NULL DEFAULT '0', "prompt_body" character varying, "sub_category" integer, "category" integer, "prompt_format" integer, "input_format" integer, CONSTRAINT "PK_21f33798862975179e40b216a1d" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "idx_prompts_prompt_format" ON "prompts" ("prompt_format") `);
		await queryRunner.query(`CREATE INDEX "idx_prompts_input_format" ON "prompts" ("input_format") `);
		await queryRunner.query(`CREATE INDEX "IDX_e429798742197e0f730bb25257" ON "prompts" ("category", "sub_category") `);
		await queryRunner.query(`CREATE INDEX "idx_prompts_feed" ON "prompts" ("is_public", "status", "date_created") `);
		await queryRunner.query(`CREATE UNIQUE INDEX "uq_prompts_slug" ON "prompts" ("slug") `);
		await queryRunner.query(`CREATE INDEX "IDX_aa88f45bd24d019088a898cf66" ON "prompts" ("user_id") `);
		await queryRunner.query(
			`CREATE TABLE "prompts_recommended_tools" ("id" SERIAL NOT NULL, "prompts_id" uuid, "recommended_tools_id" integer, CONSTRAINT "PK_be67dea5d0f7b7024bab468824c" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_2d243edc5d06cad259d5804173" ON "prompts_recommended_tools" ("prompts_id") `);
		await queryRunner.query(`CREATE INDEX "IDX_7421ad03c4cef9deb909c4b308" ON "prompts_recommended_tools" ("recommended_tools_id") `);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_89e11a74a8002a22637a29869d" ON "prompts_recommended_tools" ("prompts_id", "recommended_tools_id") `,
		);
		await queryRunner.query(
			`CREATE TABLE "recommended_tools" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "url" character varying, "tech_name" character varying, "public_id" character varying, "web_name" character varying, CONSTRAINT "PK_bbdb4c4b551eeeffd6032822a08" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_57e5aaa5c57d2bc5e0b361fdc2" ON "recommended_tools" ("tech_name") `);
		await queryRunner.query(`CREATE INDEX "IDX_2fbbe640ed0f69f6086f8633a2" ON "recommended_tools" ("name") `);
		await queryRunner.query(
			`ALTER TABLE "prompt_format_recommended_tools" ADD CONSTRAINT "FK_fe7eb00f6c7c98f399c289b8bae" FOREIGN KEY ("prompt_format_id") REFERENCES "prompt_format"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompt_format_recommended_tools" ADD CONSTRAINT "FK_8fa9fed450f98713b069775d370" FOREIGN KEY ("recommended_tools_id") REFERENCES "recommended_tools"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompts" ADD CONSTRAINT "FK_2556edbe2465c9f39920ddcf8ec" FOREIGN KEY ("prompt_format") REFERENCES "prompt_format"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompts" ADD CONSTRAINT "FK_bb80a62382a8ea446deeafd0626" FOREIGN KEY ("input_format") REFERENCES "input_format"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompts_recommended_tools" ADD CONSTRAINT "FK_2d243edc5d06cad259d58041738" FOREIGN KEY ("prompts_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompts_recommended_tools" ADD CONSTRAINT "FK_7421ad03c4cef9deb909c4b308e" FOREIGN KEY ("recommended_tools_id") REFERENCES "recommended_tools"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts_recommended_tools" DROP CONSTRAINT "FK_7421ad03c4cef9deb909c4b308e"`);
		await queryRunner.query(`ALTER TABLE "prompts_recommended_tools" DROP CONSTRAINT "FK_2d243edc5d06cad259d58041738"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_bb80a62382a8ea446deeafd0626"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_2556edbe2465c9f39920ddcf8ec"`);
		await queryRunner.query(`ALTER TABLE "prompt_format_recommended_tools" DROP CONSTRAINT "FK_8fa9fed450f98713b069775d370"`);
		await queryRunner.query(`ALTER TABLE "prompt_format_recommended_tools" DROP CONSTRAINT "FK_fe7eb00f6c7c98f399c289b8bae"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_2fbbe640ed0f69f6086f8633a2"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_57e5aaa5c57d2bc5e0b361fdc2"`);
		await queryRunner.query(`DROP TABLE "recommended_tools"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_89e11a74a8002a22637a29869d"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_7421ad03c4cef9deb909c4b308"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_2d243edc5d06cad259d5804173"`);
		await queryRunner.query(`DROP TABLE "prompts_recommended_tools"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_aa88f45bd24d019088a898cf66"`);
		await queryRunner.query(`DROP INDEX "public"."uq_prompts_slug"`);
		await queryRunner.query(`DROP INDEX "public"."idx_prompts_feed"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_e429798742197e0f730bb25257"`);
		await queryRunner.query(`DROP INDEX "public"."idx_prompts_input_format"`);
		await queryRunner.query(`DROP INDEX "public"."idx_prompts_prompt_format"`);
		await queryRunner.query(`DROP TABLE "prompts"`);
		await queryRunner.query(`DROP INDEX "public"."idx_input_format_tech_name"`);
		await queryRunner.query(`DROP TABLE "input_format"`);
		await queryRunner.query(`DROP INDEX "public"."uq_prompt_format_tech_name"`);
		await queryRunner.query(`DROP TABLE "prompt_format"`);
		await queryRunner.query(`DROP INDEX "public"."uq_prompt_format_tool"`);
		await queryRunner.query(`DROP TABLE "prompt_format_recommended_tools"`);
	}
}
