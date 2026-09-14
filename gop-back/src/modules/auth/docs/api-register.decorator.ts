import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../dto';

export function ApiRegister() {
	return applyDecorators(
		ApiOperation({ summary: 'Register a new user' }),
		ApiBody({
			type: RegisterDto,
			examples: {
				default: {
					summary: 'Example registration payload',
					value: {
						first_name: 'John',
						last_name: 'Doe',
						full_name: 'John Doe',
						email: 'john.doe@example.com',
						password: 'Password123',
						tracking: {
							utm_medium: 'google',
							utm_campaign: 'summer_sale',
							utm_content: 'ad_1',
							utm_term: 'shoes',
							affiliate_id: 'aff123',
							click_id: 'click456',
							product_slug: 'product-xyz',
						},
						product_updates: true,
						marketing_emails: false,
					},
				},
			},
		}),
		ApiResponse({
			status: 201,
			description: 'User successfully registered',
			schema: {
				example: {
					id: 'id',
					first_name: 'John',
					last_name: 'Doe',
					full_name: 'John Doe',
					email: 'john.doe@example.com',
					created_at: '2025-07-04T12:00:00Z',
					tracking: {
						id: 'tracking_id',
						utm_medium: 'google',
						utm_campaign: 'summer_sale',
						utm_content: 'ad_1',
						utm_term: 'shoes',
						affiliate_id: 'aff123',
						click_id: 'click456',
						product_slug: 'product-xyz',
					},
				},
			},
		}),
		ApiResponse({
			status: 400,
			description: 'Validation failed or bad request',
		}),
	);
}
