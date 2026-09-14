import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserVerificationCreatedAtDefault1781222400000 implements MigrationInterface {
	name = 'UserVerificationCreatedAtDefault1781222400000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user_verification" ALTER COLUMN "created_at" SET DEFAULT now()`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user_verification" ALTER COLUMN "created_at" DROP DEFAULT`);
	}
}
