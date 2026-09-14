import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPromptsSource1779580800000 implements MigrationInterface {
	name = 'AddPromptsSource1779580800000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" ADD "source" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "source"`);
	}
}
