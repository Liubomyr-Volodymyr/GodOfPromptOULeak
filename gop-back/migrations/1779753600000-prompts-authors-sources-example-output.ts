import { MigrationInterface, QueryRunner } from 'typeorm';

export class PromptsAuthorsSourcesExampleOutput1779753600000 implements MigrationInterface {
	name = 'PromptsAuthorsSourcesExampleOutput1779753600000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "authors" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_authors_id" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "sources" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "PK_sources_id" PRIMARY KEY ("id"))`,
		);

		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "source"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "example_output_image"`);

		await queryRunner.query(`ALTER TABLE "prompts" ADD "example_output_embed" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "example_output_url" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "author_id" integer`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "source_id" integer`);

		await queryRunner.query(
			`ALTER TABLE "prompts" ADD CONSTRAINT "FK_prompts_author_id" FOREIGN KEY ("author_id") REFERENCES "authors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "prompts" ADD CONSTRAINT "FK_prompts_source_id" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_prompts_source_id"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP CONSTRAINT "FK_prompts_author_id"`);

		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "source_id"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "author_id"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "example_output_url"`);
		await queryRunner.query(`ALTER TABLE "prompts" DROP COLUMN "example_output_embed"`);

		await queryRunner.query(`ALTER TABLE "prompts" ADD "source" character varying`);
		await queryRunner.query(`ALTER TABLE "prompts" ADD "example_output_image" uuid`);

		await queryRunner.query(`DROP TABLE "sources"`);
		await queryRunner.query(`DROP TABLE "authors"`);
	}
}
