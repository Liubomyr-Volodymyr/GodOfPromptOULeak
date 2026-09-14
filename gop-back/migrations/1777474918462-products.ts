import { MigrationInterface, QueryRunner } from 'typeorm';

export class Products1777474918462 implements MigrationInterface {
	name = 'Products1777474918462';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "public"."products_type_enum" AS ENUM('plan', 'addon', 'lead-magnet')`);
		await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('draft', 'published', 'archived')`);
		await queryRunner.query(
			`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "type" "public"."products_type_enum", "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "slug" character varying NOT NULL, "categories" jsonb, "stripe_product_id" character varying, "beehiiv_product_delivery_automation_id" character varying, "notion_product_access_url" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TABLE "products"`);
		await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
	}
}
