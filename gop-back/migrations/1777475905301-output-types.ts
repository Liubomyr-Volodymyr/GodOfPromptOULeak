import { MigrationInterface, QueryRunner } from 'typeorm';

export class OutputTypes1777475905301 implements MigrationInterface {
	name = 'OutputTypes1777475905301';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "output_types" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "tech_name" character varying NOT NULL, CONSTRAINT "PK_24b136294165e2f478b86e78ad6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "product_output_types" ("id" SERIAL NOT NULL, "product_id" uuid, "output_type_id" integer, CONSTRAINT "PK_ba38a205d06157320c84f085027" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE UNIQUE INDEX "IDX_0de61e2b13d16ec8953bbf6281" ON "product_output_types" ("product_id", "output_type_id") `,
		);
		await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "type" SET NOT NULL`);
		await queryRunner.query(
			`ALTER TABLE "product_output_types" ADD CONSTRAINT "FK_e513eb691bd3dfebf281029b45e" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "product_output_types" ADD CONSTRAINT "FK_61c6841f2c02a038574d5a92811" FOREIGN KEY ("output_type_id") REFERENCES "output_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "product_output_types" DROP CONSTRAINT "FK_61c6841f2c02a038574d5a92811"`);
		await queryRunner.query(`ALTER TABLE "product_output_types" DROP CONSTRAINT "FK_e513eb691bd3dfebf281029b45e"`);
		await queryRunner.query(`ALTER TABLE "products" ALTER COLUMN "type" DROP NOT NULL`);
		await queryRunner.query(`DROP INDEX "public"."IDX_0de61e2b13d16ec8953bbf6281"`);
		await queryRunner.query(`DROP TABLE "product_output_types"`);
		await queryRunner.query(`DROP TABLE "output_types"`);
	}
}
