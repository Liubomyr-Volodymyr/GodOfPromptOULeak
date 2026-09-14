import { MigrationInterface, QueryRunner } from 'typeorm';

export class Orders1781308800000 implements MigrationInterface {
	name = 'Orders1781308800000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			DO $$ BEGIN
				CREATE TYPE "orders_type_enum" AS ENUM('one_time', 'subscription', 'renewal');
			EXCEPTION WHEN duplicate_object THEN NULL; END $$
		`);
		await queryRunner.query(`
			DO $$ BEGIN
				CREATE TYPE "orders_status_enum" AS ENUM('paid', 'refunded', 'partially_refunded');
			EXCEPTION WHEN duplicate_object THEN NULL; END $$
		`);

		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "orders" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"user_id" uuid NOT NULL,
				"product_id" uuid,
				"price_id" uuid,
				"amount" numeric(12,2) NOT NULL,
				"refunded_amount" numeric(12,2) NOT NULL DEFAULT 0,
				"currency" character varying(10) NOT NULL,
				"type" "orders_type_enum" NOT NULL,
				"status" "orders_status_enum" NOT NULL DEFAULT 'paid',
				"stripe_price_id" character varying,
				"stripe_payment_intent" character varying,
				"stripe_invoice_id" character varying,
				"stripe_subscription_id" character varying,
				"stripe_customer_id" character varying,
				"purchase_utm_source" character varying,
				"purchase_utm_medium" character varying,
				"purchase_utm_campaign" character varying,
				"paid_at" timestamptz NOT NULL,
				"refunded_at" timestamptz,
				"created_at" timestamptz NOT NULL DEFAULT now(),
				"updated_at" timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
				CONSTRAINT "FK_orders_user" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
				CONSTRAINT "FK_orders_product" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL,
				CONSTRAINT "FK_orders_price" FOREIGN KEY ("price_id") REFERENCES "product_prices" ("id") ON DELETE SET NULL
			)
		`);

		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_user" ON "orders" ("user_id")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_status" ON "orders" ("status")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_type" ON "orders" ("type")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_orders_paid_at" ON "orders" ("paid_at")`);
		await queryRunner.query(
			`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_orders_stripe_payment_intent" ON "orders" ("stripe_payment_intent") WHERE "stripe_payment_intent" IS NOT NULL`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_orders_stripe_invoice_id" ON "orders" ("stripe_invoice_id") WHERE "stripe_invoice_id" IS NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "UQ_orders_stripe_invoice_id"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "UQ_orders_stripe_payment_intent"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_paid_at"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_type"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_status"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_orders_user"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
		await queryRunner.query(`DROP TYPE IF EXISTS "orders_status_enum"`);
		await queryRunner.query(`DROP TYPE IF EXISTS "orders_type_enum"`);
	}
}
