import { MigrationInterface, QueryRunner } from 'typeorm';

export class LikesBookmarksUserIdAndUserAudienceTypes1780099200000 implements MigrationInterface {
	name = 'LikesBookmarksUserIdAndUserAudienceTypes1780099200000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// Add user_id to prompt_likes
		await queryRunner.query(`
			ALTER TABLE "prompt_likes"
				ADD COLUMN "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE
		`);
		await queryRunner.query(`CREATE INDEX "IDX_prompt_likes_user_id" ON "prompt_likes" ("user_id")`);
		await queryRunner.query(`
			ALTER TABLE "prompt_likes"
				ADD CONSTRAINT "UQ_prompt_likes_prompt_user" UNIQUE ("prompt_id", "user_id")
		`);

		// Add user_id to prompt_bookmarks
		await queryRunner.query(`
			ALTER TABLE "prompt_bookmarks"
				ADD COLUMN "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE
		`);
		await queryRunner.query(`CREATE INDEX "IDX_prompt_bookmarks_user_id" ON "prompt_bookmarks" ("user_id")`);
		await queryRunner.query(`
			ALTER TABLE "prompt_bookmarks"
				ADD CONSTRAINT "UQ_prompt_bookmarks_prompt_user" UNIQUE ("prompt_id", "user_id")
		`);

		// user_audience_types join table
		await queryRunner.query(`
			CREATE TABLE "user_audience_types" (
				"id"               SERIAL PRIMARY KEY,
				"user_id"          uuid NOT NULL,
				"audience_type_id" integer NOT NULL,
				CONSTRAINT "UQ_user_audience_types" UNIQUE ("user_id", "audience_type_id"),
				CONSTRAINT "FK_user_audience_types_user"
					FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
				CONSTRAINT "FK_user_audience_types_audience_type"
					FOREIGN KEY ("audience_type_id") REFERENCES "audience_types"("id") ON DELETE CASCADE
			)
		`);
		await queryRunner.query(`CREATE INDEX "IDX_user_audience_types_user_id" ON "user_audience_types" ("user_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_user_audience_types_audience_type_id" ON "user_audience_types" ("audience_type_id")`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_user_audience_types_audience_type_id"`);
		await queryRunner.query(`DROP INDEX "IDX_user_audience_types_user_id"`);
		await queryRunner.query(`DROP TABLE "user_audience_types"`);

		await queryRunner.query(`ALTER TABLE "prompt_bookmarks" DROP CONSTRAINT "UQ_prompt_bookmarks_prompt_user"`);
		await queryRunner.query(`DROP INDEX "IDX_prompt_bookmarks_user_id"`);
		await queryRunner.query(`ALTER TABLE "prompt_bookmarks" DROP COLUMN "user_id"`);

		await queryRunner.query(`ALTER TABLE "prompt_likes" DROP CONSTRAINT "UQ_prompt_likes_prompt_user"`);
		await queryRunner.query(`DROP INDEX "IDX_prompt_likes_user_id"`);
		await queryRunner.query(`ALTER TABLE "prompt_likes" DROP COLUMN "user_id"`);
	}
}
