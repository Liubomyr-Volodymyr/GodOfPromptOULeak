import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegisterDto } from '../dto';

export function ApiTrackingData() {
	return applyDecorators(
		ApiOperation({ summary: 'Register tracking data' }),
		ApiBody({
			type: RegisterDto,
			examples: {
				default: {
					summary: 'Example tracking payload',
					value: {
						tracking: {
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
			},
		}),
		ApiResponse({
			status: 201,
			description: 'Tracking data successfully registered',
			schema: {
				example: {
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
		}),
		ApiResponse({
			status: 400,
			description: 'Validation failed or bad request',
		}),
	);
}
