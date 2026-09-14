import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptCategories1777463881825 implements MigrationInterface {
	name = 'PromptCategories1777463881825';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "public"."IDX_e429798742197e0f730bb25257"`);
		await queryRunner.query(
			`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP, "updated_at" TIMESTAMP, "name" character varying, "slug" character varying, "description" character varying, "parent_id" integer, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "sub_category"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "category"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "category_id" integer`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "sub_category_id" integer`);
		await queryRunner.query(`CREATE INDEX "IDX_8ed64fb13794c02839c8f7193d" ON "prompts" ("category_id", "sub_category_id") `);
		await queryRunner.query(
			`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompts" ADD CONSTRAINT "FK_025ceda56c30f5c7edaeee2120c" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompts" ADD CONSTRAINT "FK_cd09bbc54ba0130a92e7eba19a1" FOREIGN KEY ("sub_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_cd09bbc54ba0130a92e7eba19a1"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_025ceda56c30f5c7edaeee2120c"`);
		await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_8ed64fb13794c02839c8f7193d"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "sub_category_id"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "category_id"`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "category" integer`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "sub_category" integer`);
		await queryRunner.query(`DROP TABLE "categories"`);
		await queryRunner.query(`CREATE INDEX "IDX_e429798742197e0f730bb25257" ON "prompts" ("sub_category", "category") `);
	}
}
