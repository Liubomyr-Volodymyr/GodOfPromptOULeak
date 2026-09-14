import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInputFormat1780358400000 implements MigrationInterface {
	name = 'SeedInputFormat1780358400000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Pre-Directus catalog rows drifted from the InputType enum:
		// default_input → task, ready_prompt → ready-prompt, pre-prompt was never seeded.
		await queryRunner.query(`UPDATE "input_format" SET "name" = 'Task', "tech_name" = 'task' WHERE "tech_name" = 'default_input'`);
		await queryRunner.query(
			`UPDATE "input_format" SET "name" = 'Ready Prompt', "tech_name" = 'ready-prompt' WHERE "tech_name" = 'ready_prompt'`,
		);

		// Legacy rows were inserted with explicit ids, leaving the SERIAL sequence at 1;
		// realign it before inserting or nextval collides with existing ids (duplicate PK).
		await queryRunner.query(`
			SELECT setval(
				pg_get_serial_sequence('input_format', 'id'),
				COALESCE((SELECT MAX("id") FROM "input_format"), 1),
				(SELECT COUNT(*) FROM "input_format") > 0
			)
		`);

		await queryRunner.query(`
			INSERT INTO "input_format" ("name", "tech_name") VALUES
				('Task', 'task'),
				('Pre Prompt', 'pre-prompt'),
				('Ready Prompt', 'ready-prompt')
			ON CONFLICT ("tech_name") DO NOTHING
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DELETE FROM "input_format" WHERE "tech_name" = 'pre-prompt'`);
		await queryRunner.query(
			`UPDATE "input_format" SET "name" = 'Ready Prompt', "tech_name" = 'ready_prompt' WHERE "tech_name" = 'ready-prompt'`,
		);
		await queryRunner.query(
			`UPDATE "input_format" SET "name" = 'Default Input', "tech_name" = 'default_input' WHERE "tech_name" = 'task'`,
		);
	}
}
