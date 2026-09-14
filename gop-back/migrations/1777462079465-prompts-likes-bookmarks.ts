import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptsLikesBookmarks1777462079465 implements MigrationInterface {
	name = 'PromptsLikesBookmarks1777462079465';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "prompt_likes" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "prompt_id" uuid, CONSTRAINT "PK_808ac69ddcf799248f765d69c58" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_30c7a1ec0e70b965385e201307" ON "prompt_likes" ("prompt_id") `);
		await queryRunner.query(`CREATE INDEX "idx_prompt_likes_prompt_id" ON "prompt_likes" ("prompt_id") `);
		await queryRunner.query(
			`CREATE TABLE "prompt_bookmarks" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "prompt_id" uuid, CONSTRAINT "PK_c04bcd8937ff7d091795a47e4e6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE INDEX "IDX_21fb42381c60ce6c4f7191ac1a" ON "prompt_bookmarks" ("prompt_id") `);
		await queryRunner.query(`CREATE INDEX "idx_prompt_bookmarks_prompt_id" ON "prompt_bookmarks" ("prompt_id") `);
		await queryRunner.query(
			`ALTER TABLE "prompt_likes" ADD CONSTRAINT "FK_30c7a1ec0e70b965385e2013077" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompt_bookmarks" ADD CONSTRAINT "FK_21fb42381c60ce6c4f7191ac1a7" FOREIGN KEY ("prompt_id") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompt_bookmarks" DROP CONSTRAINT "FK_21fb42381c60ce6c4f7191ac1a7"`);
		await queryRunner.query(`ALTER TABLE "prompt_likes" DROP CONSTRAINT "FK_30c7a1ec0e70b965385e2013077"`);
		await queryRunner.query(`DROP INDEX "public"."idx_prompt_bookmarks_prompt_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_21fb42381c60ce6c4f7191ac1a"`);
		await queryRunner.query(`DROP TABLE "prompt_bookmarks"`);
		await queryRunner.query(`DROP INDEX "public"."idx_prompt_likes_prompt_id"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_30c7a1ec0e70b965385e201307"`);
		await queryRunner.query(`DROP TABLE "prompt_likes"`);
	}
}
