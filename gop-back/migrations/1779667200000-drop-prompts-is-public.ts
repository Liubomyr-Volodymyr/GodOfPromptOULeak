import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPromptsIsPublic1779667200000 implements MigrationInterface {
	name = 'DropPromptsIsPublic1779667200000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_prompts_feed"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "is_public"`);
		await queryRunner.query(`CREATE INDEX "idx_prompts_feed" ON "prompts" ("status", "date_created")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."idx_prompts_feed"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "is_public" boolean`);
		await queryRunner.query(`CREATE INDEX "idx_prompts_feed" ON "prompts" ("is_public", "status", "date_created")`);
	}
}
