import { MigrationInterface, QueryRunner } from 'typeorm';

export class Users1777472028278 implements MigrationInterface {
	name = 'Users1777472028278';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "user_emails" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_3ef6c4be97ba94ea3ba65362ad0" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6594597afde633cfeab9a806e4" ON "user_emails" ("email") `);
		await queryRunner.query(
			`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying, "last_name" character varying, "full_name" character varying, "first_utm_source" character varying, "first_utm_medium" character varying, "first_utm_campaign" character varying, "first_utm_content" character varying, "first_utm_term" character varying, "first_purchase_utm" character varying, "lead_magnet_slug" character varying, "last_purchase" TIMESTAMP, "first_purchase" TIMESTAMP, "last_checked_notifications" TIMESTAMP, "ltv" numeric, "stripe_id" character varying, "is_verified" boolean, "current_status" character varying, "avatar" uuid, "email" uuid, "phone" character varying, "last_login" TIMESTAMP, "marketing_emails" boolean, "password" character varying, "product_updates" boolean, "country" character varying, "country_code" character varying, "city" character varying, "state" character varying, "postal_code" character varying, "stripe_customer_id" character varying, "beehiv_subscriber_id" character varying, "user_products" character varying, "created_at" TIMESTAMP, "updated_at" TIMESTAMP, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "user_emails" ADD CONSTRAINT "FK_2e88b95787b903d46ab3cc3eb91" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "user_emails" DROP CONSTRAINT "FK_2e88b95787b903d46ab3cc3eb91"`);
		await queryRunner.query(`DROP TABLE "users"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_6594597afde633cfeab9a806e4"`);
		await queryRunner.query(`DROP TABLE "user_emails"`);
	}
}
