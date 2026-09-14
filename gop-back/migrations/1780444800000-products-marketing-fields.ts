import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductsMarketingFields1780444800000 implements MigrationInterface {
	name = 'ProductsMarketingFields1780444800000';

	private readonly columns: string[] = [
		'icon_url',
		'product_tab_image_url',
		'opengraph_image_url',
		'instagram_tab_image_url',
		'twitter_tab_image_url',
		'checkout_url',
		'subscription_url',
		'landing_page_url',
		'success_url',
		'subscription_success_url',
		'success_cms_url',
		'prompt_library_url',
		'instagram_giveaway_url',
		'notion_link',
		'external_product_id',
		'llm',
		'subscription_slug',
	];

	public async up(queryRunner: QueryRunner): Promise<void> {
		for (const column of this.columns) {
			await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "${column}" character varying`);
		}

		await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "full_price" numeric`);
		await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "lifetime_price" numeric`);
		await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "monthly_price" numeric`);
		await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "annual_price" numeric`);

		await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "utm" jsonb`);
		await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "features" jsonb`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		const dropped: string[] = [...this.columns, 'full_price', 'lifetime_price', 'monthly_price', 'annual_price', 'utm', 'features'];

		for (const column of dropped) {
			await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "${column}"`);
		}
	}
}
