import { MigrationInterface, QueryRunner } from 'typeorm';

export class ToolTechNameToSlugDropWebName1779840000000 implements MigrationInterface {
	name = 'ToolTechNameToSlugDropWebName1779840000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "tools" RENAME COLUMN "tech_name" TO "slug"`);
		await queryRunner.query(`ALTER TABLE "tools" DROP COLUMN "web_name"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "tools" ADD "web_name" character varying`);
		await queryRunner.query(`ALTER TABLE "tools" RENAME COLUMN "slug" TO "tech_name"`);
	}
}
