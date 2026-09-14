import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptsDateUpdated1780704000000 implements MigrationInterface {
	name = 'PromptsDateUpdated1780704000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" ADD COLUMN IF NOT EXISTS "date_updated" TIMESTAMP`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN IF EXISTS "date_updated"`);
	}
}
