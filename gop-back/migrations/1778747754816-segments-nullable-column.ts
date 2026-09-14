import { MigrationInterface, QueryRunner } from 'typeorm';

export class SegmentsNullableColumn1778747754816 implements MigrationInterface {
	name = 'SegmentsNullableColumn1778747754816';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "segments" ALTER COLUMN "stripe_price_id" DROP NOT NULL`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "segments" ALTER COLUMN "stripe_price_id" SET NOT NULL`);
	}
}
