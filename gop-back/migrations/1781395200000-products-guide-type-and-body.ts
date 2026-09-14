import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductsGuideTypeAndBody1781395200000 implements MigrationInterface {
	name = 'ProductsGuideTypeAndBody1781395200000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TYPE "public"."products_type_enum" RENAME TO "products_type_enum_old"`);
		await queryRunner.query(`CREATE TYPE "public"."products_type_enum" AS ENUM('plan', 'addon', 'lead-magnet', 'guide')`);
		await queryRunner.query(
			`ALTER TABLE "products" ALTER COLUMN "type" TYPE "public"."products_type_enum" USING "type"::text::"public"."products_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."products_type_enum_old"`);

		await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "body" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "body"`);

		await queryRunner.query(`UPDATE "products" SET "type" = 'lead-magnet' WHERE "type" = 'guide'`);
		await queryRunner.query(`ALTER TYPE "public"."products_type_enum" RENAME TO "products_type_enum_old"`);
		await queryRunner.query(`CREATE TYPE "public"."products_type_enum" AS ENUM('plan', 'addon', 'lead-magnet')`);
		await queryRunner.query(
			`ALTER TABLE "products" ALTER COLUMN "type" TYPE "public"."products_type_enum" USING "type"::text::"public"."products_type_enum"`,
		);
		await queryRunner.query(`DROP TYPE "public"."products_type_enum_old"`);
	}
}
