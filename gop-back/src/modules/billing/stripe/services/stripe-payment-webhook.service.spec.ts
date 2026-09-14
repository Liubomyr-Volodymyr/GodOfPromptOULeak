import { StripePaymentWebhookService } from './stripe-payment-webhook.service';

describe('StripePaymentWebhookService', () => {
	const originalWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
	const originalAppTitle = process.env.APP_TITLE;

	beforeEach(() => {
		process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
		process.env.APP_TITLE = 'gop-back';
	});

	afterAll(() => {
		process.env.STRIPE_WEBHOOK_SECRET = originalWebhookSecret;
		process.env.APP_TITLE = originalAppTitle;
	});

	it('should complete a task after a successful charge webhook', async () => {
		const stripe = {
			webhooks: {
				constructEvent: jest.fn().mockReturnValue({
					type: 'charge.succeeded',
					data: {
						object: {
							id: 'ch_123',
							amount: 1900,
							payment_intent: 'pi_123',
							billing_details: {
								address: {
									country: 'US',
								},
							},
							metadata: {
								email: 'member@example.com',
								task_id: '42',
								webhook_id: 'gop-back',
							},
						},
					},
				}),
			},
		};
		const stripeClientService = {
			getClient: jest.fn().mockReturnValue(stripe),
			incrementRequestsCount: jest.fn().mockResolvedValue(undefined),
		};
		const customGeneratorService = {
			completeTask: jest.fn().mockResolvedValue(undefined),
		};

		const service = new StripePaymentWebhookService(
			{
				update: jest.fn(),
				findOne: jest.fn(),
			} as any,
			stripeClientService as any,
			{} as any,
			customGeneratorService as any,
			{ send: jest.fn().mockResolvedValue(undefined), hashEmail: jest.fn().mockReturnValue('hashed') } as any,
		);

		await service.handleWebhook('sig_test', Buffer.from('payload'));

		expect(stripeClientService.incrementRequestsCount).toHaveBeenCalledWith('member@example.com');
		expect(customGeneratorService.completeTask).toHaveBeenCalledWith({
			task_id: 42,
			spend: 19,
			event_id: 'pi_123',
			country: 'US',
		});
	});

	it('should ignore webhook events from a different app title', async () => {
		const stripe = {
			webhooks: {
				constructEvent: jest.fn().mockReturnValue({
					type: 'charge.succeeded',
					data: {
						object: {
							metadata: {
								email: 'member@example.com',
								task_id: '42',
								webhook_id: 'another-app',
							},
						},
					},
				}),
			},
		};
		const stripeClientService = {
			getClient: jest.fn().mockReturnValue(stripe),
			incrementRequestsCount: jest.fn(),
		};
		const customGeneratorService = {
			completeTask: jest.fn(),
		};

		const service = new StripePaymentWebhookService(
			{
				update: jest.fn(),
				findOne: jest.fn(),
			} as any,
			stripeClientService as any,
			{} as any,
			customGeneratorService as any,
			{ send: jest.fn().mockResolvedValue(undefined), hashEmail: jest.fn().mockReturnValue('hashed') } as any,
		);

		const result = await service.handleWebhook('sig_test', Buffer.from('payload'));

		expect(result).toEqual({ received: true });
		expect(stripeClientService.incrementRequestsCount).not.toHaveBeenCalled();
		expect(customGeneratorService.completeTask).not.toHaveBeenCalled();
	});
});
