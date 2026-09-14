import { MigrationInterface, QueryRunner } from 'typeorm';

export class Reviews1780876800000 implements MigrationInterface {
	name = 'Reviews1780876800000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "reviews" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"review" jsonb NOT NULL,
				"user" jsonb NOT NULL,
				"stars_amount" integer NOT NULL,
				"created_at" timestamptz NOT NULL DEFAULT now(),
				"updated_at" timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT "PK_reviews" PRIMARY KEY ("id"),
				CONSTRAINT "CHK_reviews_stars_amount" CHECK ("stars_amount" BETWEEN 1 AND 5)
			)
		`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reviews_created_at" ON "reviews" ("created_at")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_created_at"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
	}
}
