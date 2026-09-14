import { MigrationInterface, QueryRunner } from 'typeorm';

export class AudienceTypes1780012800000 implements MigrationInterface {
	name = 'AudienceTypes1780012800000';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
			CREATE TABLE "audience_types" (
				"id"   SERIAL PRIMARY KEY,
				"name" character varying NOT NULL,
				"slug" character varying NOT NULL,
				CONSTRAINT "UQ_audience_types_slug" UNIQUE ("slug")
			)
		`);

		await queryRunner.query(`CREATE INDEX "IDX_audience_types_slug" ON "audience_types" ("slug")`);

		await queryRunner.query(`
			CREATE TABLE "prompts_audience_types" (
				"id"               SERIAL PRIMARY KEY,
				"prompt_id"        uuid NOT NULL,
				"audience_type_id" integer NOT NULL,
				CONSTRAINT "UQ_prompts_audience_types" UNIQUE ("prompt_id", "audience_type_id"),
				CONSTRAINT "FK_prompts_audience_types_prompt"
					FOREIGN KEY ("prompt_id") REFERENCES "prompts" ("id") ON DELETE CASCADE,
				CONSTRAINT "FK_prompts_audience_types_audience_type"
					FOREIGN KEY ("audience_type_id") REFERENCES "audience_types" ("id") ON DELETE CASCADE
			)
		`);

		await queryRunner.query(`CREATE INDEX "IDX_prompts_audience_types_prompt_id" ON "prompts_audience_types" ("prompt_id")`);
		await queryRunner.query(`CREATE INDEX "IDX_prompts_audience_types_audience_type_id" ON "prompts_audience_types" ("audience_type_id")`);

		await queryRunner.query(`
			INSERT INTO "audience_types" ("name", "slug") VALUES
				('Solopreneurs',       'solopreneurs'),
				('Entrepreneurs',      'entrepreneurs'),
				('Business Owners',    'business-owners'),
				('Freelancers',        'freelancers'),
				('Agencies',           'agencies'),
				('Ecommerce Sellers',  'ecommerce-sellers'),
				('Marketers',          'marketers'),
				('Sales Teams',        'sales-teams'),
				('Copywriters',        'copywriters'),
				('Content Creators',   'content-creators'),
				('Designers',          'designers'),
				('Photographers',      'photographers'),
				('Developers',         'developers'),
				('AI Engineers',       'ai-engineers'),
				('Lawyers',            'lawyers'),
				('Doctors',            'doctors'),
				('Accountants',        'accountants'),
				('Real Estate Agents', 'real-estate-agents'),
				('Recruiters',         'recruiters'),
				('Teachers',           'teachers'),
				('Students',           'students'),
				('Coaches',            'coaches'),
				('Consultants',        'consultants'),
				('Virtual Assistants', 'virtual-assistants'),
				('Traders',            'traders')
		`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_prompts_audience_types_audience_type_id"`);
		await queryRunner.query(`DROP INDEX "IDX_prompts_audience_types_prompt_id"`);
		await queryRunner.query(`DROP TABLE "prompts_audience_types"`);
		await queryRunner.query(`DROP INDEX "IDX_audience_types_slug"`);
		await queryRunner.query(`DROP TABLE "audience_types"`);
	}
}
