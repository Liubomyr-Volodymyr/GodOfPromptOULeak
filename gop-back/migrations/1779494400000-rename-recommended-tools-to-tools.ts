import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameRecommendedToolsToTools1779494400000 implements MigrationInterface {
	name = 'RenameRecommendedToolsToTools1779494400000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "recommended_tools" RENAME TO "tools"`);
		await queryRunner.query(`ALTER TABLE "prompts_recommended_tools" RENAME TO "prompts_tools"`);
		await queryRunner.query(`ALTER TABLE "prompt_format_recommended_tools" RENAME TO "prompt_format_tools"`);
		await queryRunner.query(
			`ALTER TABLE "prompt_field_ai_instructions_recommended_tools" RENAME TO "prompt_field_ai_instructions_tools"`,
		);

		await queryRunner.query(`ALTER TABLE "prompts_tools" RENAME COLUMN "recommended_tools_id" TO "tool_id"`);
		await queryRunner.query(`ALTER TABLE "prompt_format_tools" RENAME COLUMN "recommended_tools_id" TO "tool_id"`);
		await queryRunner.query(`ALTER TABLE "prompt_field_ai_instructions_tools" RENAME COLUMN "recommended_tools_id" TO "tool_id"`);
		await queryRunner.query(`ALTER TABLE "prompt_field_ai_instructions" RENAME COLUMN "recommended_tool_id" TO "tool_id"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompt_field_ai_instructions" RENAME COLUMN "tool_id" TO "recommended_tool_id"`);
		await queryRunner.query(`ALTER TABLE "prompt_field_ai_instructions_tools" RENAME COLUMN "tool_id" TO "recommended_tools_id"`);
		await queryRunner.query(`ALTER TABLE "prompt_format_tools" RENAME COLUMN "tool_id" TO "recommended_tools_id"`);
		await queryRunner.query(`ALTER TABLE "prompts_tools" RENAME COLUMN "tool_id" TO "recommended_tools_id"`);

		await queryRunner.query(
			`ALTER TABLE "prompt_field_ai_instructions_tools" RENAME TO "prompt_field_ai_instructions_recommended_tools"`,
		);
		await queryRunner.query(`ALTER TABLE "prompt_format_tools" RENAME TO "prompt_format_recommended_tools"`);
		await queryRunner.query(`ALTER TABLE "prompts_tools" RENAME TO "prompts_recommended_tools"`);
		await queryRunner.query(`ALTER TABLE "tools" RENAME TO "recommended_tools"`);
	}
}
