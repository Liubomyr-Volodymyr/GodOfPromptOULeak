import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropBlogPostsTouchTrigger1781049600000 implements MigrationInterface {
	name = 'DropBlogPostsTouchTrigger1781049600000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP TRIGGER IF EXISTS "blog_posts_touch" ON "blog_posts"`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
			BEGIN NEW.updated_at = now(); RETURN NEW; END;
			$$ LANGUAGE plpgsql
		`);
		await queryRunner.query(`
			CREATE TRIGGER "blog_posts_touch" BEFORE UPDATE ON "blog_posts"
			FOR EACH ROW EXECUTE FUNCTION touch_updated_at()
		`);
	}
}
