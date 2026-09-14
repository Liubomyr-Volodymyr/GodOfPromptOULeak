import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPromptsNotionPageId1779115369484 implements MigrationInterface {
	name = 'DropPromptsNotionPageId1779115369484';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "notion_page_id"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" ADD "notion_page_id" character varying`);
	}
}
