import { MigrationInterface, QueryRunner } from 'typeorm';

export class Admins1777378103677 implements MigrationInterface {
	name = 'Admins1777378103677';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "public"."admins_role_enum" AS ENUM('superadmin', 'admin', 'manager', 'moderator')`);
		await queryRunner.query(
			`CREATE TABLE "admins" ("id" SERIAL NOT NULL, "email" character varying, "password" character varying, "is_active" boolean, "first_name" character varying, "last_name" character varying, "role" "public"."admins_role_enum" NOT NULL DEFAULT 'manager', "avatar_id" uuid, CONSTRAINT "PK_e3b38270c97a854c48d2e80874e" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "admins"`);
		await queryRunner.query(`DROP TYPE "public"."admins_role_enum"`);
	}
}
