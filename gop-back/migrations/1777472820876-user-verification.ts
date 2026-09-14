import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserVerification1777472820876 implements MigrationInterface {
	name = 'UserVerification1777472820876';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "user_verification" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "email" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL, "expires_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_679edeb6fcfcbc4c094573e27e7" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "user_verification"`);
	}
}
