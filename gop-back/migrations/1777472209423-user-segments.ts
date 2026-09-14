import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserSegments1777472209423 implements MigrationInterface {
	name = 'UserSegments1777472209423';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "segments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "stripe_price_id" character varying NOT NULL, CONSTRAINT "UQ_b3d4f9651ec1c452592156367b7" UNIQUE ("stripe_price_id"), CONSTRAINT "PK_beff1eec19679fe8ad4f291f04e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "users_segments" ("id" SERIAL NOT NULL, "user_id" uuid, "segment_id" uuid, CONSTRAINT "PK_5da7fae53432c271a19cae15283" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3f97238614875cde848a80c238" ON "users_segments" ("user_id", "segment_id") `);
		await queryRunner.query(
			`ALTER TABLE "users_segments" ADD CONSTRAINT "FK_c77683272cfdcd147d39e42fad6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "users_segments" ADD CONSTRAINT "FK_96ae3ecfda67ad098b487aa9eee" FOREIGN KEY ("segment_id") REFERENCES "segments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "users_segments" DROP CONSTRAINT "FK_96ae3ecfda67ad098b487aa9eee"`);
		await queryRunner.query(`ALTER TABLE "users_segments" DROP CONSTRAINT "FK_c77683272cfdcd147d39e42fad6"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_3f97238614875cde848a80c238"`);
		await queryRunner.query(`DROP TABLE "users_segments"`);
		await queryRunner.query(`DROP TABLE "segments"`);
	}
}
