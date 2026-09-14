import { MigrationInterface, QueryRunner } from 'typeorm';

export class Notifications1780531200000 implements MigrationInterface {
	name = 'Notifications1780531200000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE IF NOT EXISTS "notifications" (
				"id" uuid NOT NULL DEFAULT uuid_generate_v4(),
				"user_id" uuid,
				"segment_id" uuid,
				"title" character varying NOT NULL,
				"description" text,
				"image" character varying,
				"author" character varying,
				"is_read" boolean NOT NULL DEFAULT false,
				"read_at" timestamptz,
				"created_at" timestamptz NOT NULL DEFAULT now(),
				CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
			)
		`);

		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_user_created" ON "notifications" ("user_id", "created_at")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notifications_segment" ON "notifications" ("segment_id")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_segment"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_created"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
	}
}
