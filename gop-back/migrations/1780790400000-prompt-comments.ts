import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptComments1780790400000 implements MigrationInterface {
	name = 'PromptComments1780790400000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "prompt_comments" (
				"id" SERIAL PRIMARY KEY,
				"prompt_id" uuid,
				"user_id" uuid,
				"text" text NOT NULL,
				"created_at" TIMESTAMP NOT NULL DEFAULT now(),
				"updated_at" TIMESTAMP NOT NULL DEFAULT now(),
				CONSTRAINT "FK_prompt_comments_prompt_id" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_prompt_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_prompt_comments_prompt_id" ON "prompt_comments" ("prompt_id")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_prompt_comments_user_id" ON "prompt_comments" ("user_id")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE IF EXISTS "prompt_comments"`);
	}
}
