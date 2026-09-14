import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserProductsAndPrices1777502838697 implements MigrationInterface {
	name = 'UserProductsAndPrices1777502838697';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE "public"."product_prices_price_type_enum" AS ENUM('one_time', 'recurring')`);
		await queryRunner.query(
			`CREATE TABLE "product_prices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" numeric NOT NULL, "currency" character varying(10) NOT NULL, "price_type" "public"."product_prices_price_type_enum" NOT NULL, "price_period" character varying, "stripe_price_id" character varying NOT NULL, "product_price_name" character varying NOT NULL, "product_id" uuid, CONSTRAINT "UQ_3569fd578e2b955250d819ffb5b" UNIQUE ("stripe_price_id"), CONSTRAINT "PK_31c33ddacf759f7c0e5d327c4bb" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3569fd578e2b955250d819ffb5" ON "product_prices" ("stripe_price_id") `);
		await queryRunner.query(`CREATE INDEX "IDX_8218c69c7f5a3706662101fa78" ON "product_prices" ("product_id") `);
		await queryRunner.query(`CREATE TYPE "public"."user_products_access_type_enum" AS ENUM('trial', 'limited', 'full')`);
		await queryRunner.query(`CREATE TYPE "public"."user_products_status_enum" AS ENUM('active', 'inactive')`);
		await queryRunner.query(
			`CREATE TABLE "user_products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "access_type" "public"."user_products_access_type_enum" NOT NULL, "status" "public"."user_products_status_enum" NOT NULL DEFAULT 'active', "purchase_utm_source" character varying, "purchase_utm_medium" character varying, "purchase_utm_campaign" character varying, "stripe_one_time_purchase_id" character varying, "stripe_subscription_id" character varying, "payment_intent" character varying, "granted_at" TIMESTAMP, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, "product_id" uuid, "price_id" uuid, CONSTRAINT "PK_347cc741febfe07d6d46d048fb4" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_68f5b06c3111a51d86cd67ca97" ON "user_products" ("price_id") `);
		await queryRunner.query(`CREATE INDEX "IDX_8b059a1db24054ba759c7de408" ON "user_products" ("status") `);
		await queryRunner.query(`CREATE INDEX "IDX_b9470e455b81e2f0bc0d32f269" ON "user_products" ("user_id", "product_id") `);
		await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_products"`);
		await queryRunner.query(`ALTER TABLE "output_types" DROP COLUMN "tech_name"`);
		await queryRunner.query(`ALTER TABLE "output_types" ADD "tech_name" character varying(50) NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "product_prices" ADD CONSTRAINT "FK_8218c69c7f5a3706662101fa788" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_products" ADD CONSTRAINT "FK_494f0246efbe65076d1051c6539" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_products" ADD CONSTRAINT "FK_1c5a5dc69b4ac2b5ee475684779" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_products" ADD CONSTRAINT "FK_68f5b06c3111a51d86cd67ca972" FOREIGN KEY ("price_id") REFERENCES "product_prices"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user_products" DROP CONSTRAINT "FK_68f5b06c3111a51d86cd67ca972"`);
		await queryRunner.query(`ALTER TABLE "user_products" DROP CONSTRAINT "FK_1c5a5dc69b4ac2b5ee475684779"`);
		await queryRunner.query(`ALTER TABLE "user_products" DROP CONSTRAINT "FK_494f0246efbe65076d1051c6539"`);
		await queryRunner.query(`ALTER TABLE "product_prices" DROP CONSTRAINT "FK_8218c69c7f5a3706662101fa788"`);
		await queryRunner.query(`ALTER TABLE "output_types" DROP COLUMN "tech_name"`);
		await queryRunner.query(`ALTER TABLE "output_types" ADD "tech_name" character varying NOT NULL`);
		await queryRunner.query(`ALTER TABLE "users" ADD "user_products" character varying`);
		await queryRunner.query(`DROP INDEX "public"."IDX_b9470e455b81e2f0bc0d32f269"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_8b059a1db24054ba759c7de408"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_68f5b06c3111a51d86cd67ca97"`);
		await queryRunner.query(`DROP TABLE "user_products"`);
		await queryRunner.query(`DROP TYPE "public"."user_products_status_enum"`);
		await queryRunner.query(`DROP TYPE "public"."user_products_access_type_enum"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_8218c69c7f5a3706662101fa78"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_3569fd578e2b955250d819ffb5"`);
		await queryRunner.query(`DROP TABLE "product_prices"`);
		await queryRunner.query(`DROP TYPE "public"."product_prices_price_type_enum"`);
	}
}
