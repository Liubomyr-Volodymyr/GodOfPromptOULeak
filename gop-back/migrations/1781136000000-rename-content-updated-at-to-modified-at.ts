import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameContentUpdatedAtToModifiedAt1781136000000 implements MigrationInterface {
	name = 'RenameContentUpdatedAtToModifiedAt1781136000000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "blog_posts" RENAME COLUMN "content_updated_at" TO "modified_at"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "blog_posts" RENAME COLUMN "modified_at" TO "content_updated_at"`);
	}
}
