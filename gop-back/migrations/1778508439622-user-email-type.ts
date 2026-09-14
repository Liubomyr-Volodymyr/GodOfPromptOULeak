import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEmailType1778508439622 implements MigrationInterface {
	name = 'UserEmailType1778508439622';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
		await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
		await queryRunner.query(`ALTER TABLE "users" ADD "email" uuid`);
	}
}
