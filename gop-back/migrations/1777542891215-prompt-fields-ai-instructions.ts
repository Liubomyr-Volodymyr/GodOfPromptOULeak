import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptFieldsAiInstructions1777542891215 implements MigrationInterface {
	name = 'PromptFieldsAiInstructions1777542891215';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "prompt_field_ai_instructions" ("id" SERIAL NOT NULL, "prompt_field_name" character varying NOT NULL, "field_ai_instruction" text NOT NULL, "field_ai_instruction_premium" text, "prompt_format_id" integer, "recommended_tool_id" integer, CONSTRAINT "PK_7b42b5c4c88e72df643915f7ec7" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_65498d2212a51fcbde7b751ebf" ON "prompt_field_ai_instructions" ("prompt_field_name") `);
		await queryRunner.query(`CREATE INDEX "IDX_a04eb490dd5543c183b11b22c7" ON "prompt_field_ai_instructions" ("recommended_tool_id") `);
		await queryRunner.query(`CREATE INDEX "IDX_6282bfd5bb6f9ff878a9a0ab62" ON "prompt_field_ai_instructions" ("prompt_format_id") `);
		await queryRunner.query(
			`CREATE TABLE "prompt_field_ai_instructions_prompt_format" ("id" SERIAL NOT NULL, "prompt_field_ai_instructions_id" integer, "prompt_format_id" integer, CONSTRAINT "PK_6282bfd5bb6f9ff878a9a0ab62d" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "prompt_field_ai_instructions_recommended_tools" ("id" SERIAL NOT NULL, "prompt_field_ai_instructions_id" integer, "recommended_tools_id" integer, CONSTRAINT "PK_7c2eec93aca2281b069dfc8661b" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompt_field_ai_instructions" ADD CONSTRAINT "FK_6282bfd5bb6f9ff878a9a0ab62d" FOREIGN KEY ("prompt_format_id") REFERENCES "prompt_format"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompt_field_ai_instructions" ADD CONSTRAINT "FK_a04eb490dd5543c183b11b22c70" FOREIGN KEY ("recommended_tool_id") REFERENCES "recommended_tools"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompt_field_ai_instructions" DROP CONSTRAINT "FK_a04eb490dd5543c183b11b22c70"`);
		await queryRunner.query(`ALTER TABLE "prompt_field_ai_instructions" DROP CONSTRAINT "FK_6282bfd5bb6f9ff878a9a0ab62d"`);
		await queryRunner.query(`DROP TABLE "prompt_field_ai_instructions_recommended_tools"`);
		await queryRunner.query(`DROP TABLE "prompt_field_ai_instructions_prompt_format"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_6282bfd5bb6f9ff878a9a0ab62"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_a04eb490dd5543c183b11b22c7"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_65498d2212a51fcbde7b751ebf"`);
		await queryRunner.query(`DROP TABLE "prompt_field_ai_instructions"`);
	}
}
