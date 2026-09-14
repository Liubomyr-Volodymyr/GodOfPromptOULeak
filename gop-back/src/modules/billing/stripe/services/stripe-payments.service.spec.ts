import { StripePaymentsService } from './stripe-payments.service';

describe('StripePaymentsService', () => {
	const originalFreeRequestsCount = process.env.FREE_REQUESTS_COUNT;
	const originalSuccessUrl = process.env.STRIPE_SUCCESS_URL;
	const originalCancelUrl = process.env.STRIPE_CANCEL_URL;
	const originalAppTitle = process.env.APP_TITLE;
	const originalStripePriceId = process.env.STRIPE_PRICE_ID;

	beforeEach(() => {
		process.env.FREE_REQUESTS_COUNT = '3';
		process.env.STRIPE_SUCCESS_URL = 'http://frontend/success';
		process.env.STRIPE_CANCEL_URL = 'http://frontend/cancel';
		process.env.APP_TITLE = 'gop-back';
		process.env.STRIPE_PRICE_ID = 'price_default';
	});

	afterAll(() => {
		process.env.FREE_REQUESTS_COUNT = originalFreeRequestsCount;
		process.env.STRIPE_SUCCESS_URL = originalSuccessUrl;
		process.env.STRIPE_CANCEL_URL = originalCancelUrl;
		process.env.APP_TITLE = originalAppTitle;
		process.env.STRIPE_PRICE_ID = originalStripePriceId;
	});

	it('should complete a free request when the customer is below the free quota', async () => {
		const customerModel = {
			findOne: jest.fn().mockResolvedValue({
				email: 'member@example.com',
				requests_count: 1,
				card_verified: false,
				stripe_customer_id: 'cus_123',
			}),
		};
		const stripeClientService = {
			getClient: jest.fn().mockReturnValue({}),
			incrementRequestsCount: jest.fn().mockResolvedValue(undefined),
		};
		const customGeneratorService = {
			dbCreateTask: jest.fn().mockResolvedValue({ task_id: 42 }),
			completeTask: jest.fn(),
		};
		const usersService = {
			findUserByEmail: jest.fn().mockResolvedValue({ id: 'user-1' }),
			checkIsUserPremium: jest.fn().mockResolvedValue(false),
		};

		const service = new StripePaymentsService(
			customerModel as any,
			stripeClientService as any,
			customGeneratorService as any,
			usersService as any,
		);

		const result = await service.createCheckoutSession({
			email: 'member@example.com',
			member_id: 'user-1',
			task: 'Create a long enough authenticated task.',
			access_token: 'token',
		});

		expect(result).toEqual({ url: 'http://frontend/success', task_id: 42 });
		expect(stripeClientService.incrementRequestsCount).toHaveBeenCalledWith('member@example.com');
		expect(customGeneratorService.completeTask).toHaveBeenCalledWith(
			expect.objectContaining({
				task_id: 42,
				spend: 0,
				country: null,
			}),
		);
	});

	it('should create a setup checkout session when no verified card exists', async () => {
		process.env.FREE_REQUESTS_COUNT = '0';

		const checkoutCreate = jest.fn().mockResolvedValue({ url: 'https://stripe.test/session' });
		const stripe = {
			customers: {
				list: jest.fn().mockResolvedValue({ data: [] }),
				create: jest.fn().mockResolvedValue({ id: 'cus_123' }),
			},
			checkout: {
				sessions: {
					create: checkoutCreate,
				},
			},
		};
		const customerModel = {
			findOne: jest.fn().mockResolvedValue(null),
			create: jest.fn().mockReturnValue({ email: 'member@example.com', stripe_customer_id: 'cus_123' }),
			save: jest.fn().mockResolvedValue({ email: 'member@example.com', stripe_customer_id: 'cus_123' }),
		};
		const stripeClientService = {
			getClient: jest.fn().mockReturnValue(stripe),
		};
		const customGeneratorService = {
			dbCreateTask: jest.fn().mockResolvedValue({ task_id: 42 }),
			completeTask: jest.fn(),
		};
		const usersService = {
			findUserByEmail: jest.fn().mockResolvedValue(null),
			checkIsUserPremium: jest.fn(),
		};

		const service = new StripePaymentsService(
			customerModel as any,
			stripeClientService as any,
			customGeneratorService as any,
			usersService as any,
		);

		const result = await service.createCheckoutSession({
			email: 'member@example.com',
			member_id: 'user-1',
			task: 'Create a long enough authenticated task.',
			access_token: 'token',
		});

		expect(result).toEqual({ url: 'https://stripe.test/session', task_id: 42 });
		expect(checkoutCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: 'setup',
				customer: 'cus_123',
				success_url: 'http://frontend/success',
				cancel_url: 'http://frontend/cancel',
				metadata: expect.objectContaining({
					email: 'member@example.com',
					task_id: 42,
					member_id: 'user-1',
					webhook_id: 'gop-back',
					is_setup: 'true',
				}),
			}),
		);
	});

	it('should create an off-session payment for verified customers past the free quota', async () => {
		const paymentIntentCreate = jest.fn().mockResolvedValue({ id: 'pi_123' });
		const stripe = {
			prices: {
				retrieve: jest.fn().mockResolvedValue({ unit_amount: 2500 }),
			},
			paymentMethods: {
				list: jest.fn().mockResolvedValue({ data: [{ id: 'pm_123' }] }),
			},
			paymentIntents: {
				create: paymentIntentCreate,
			},
		};
		const customerModel = {
			findOne: jest.fn().mockResolvedValue({
				email: 'member@example.com',
				requests_count: 3,
				card_verified: true,
				stripe_customer_id: 'cus_123',
			}),
		};
		const stripeClientService = {
			getClient: jest.fn().mockReturnValue(stripe),
		};
		const customGeneratorService = {
			dbCreateTask: jest.fn().mockResolvedValue({ task_id: 42 }),
			completeTask: jest.fn(),
		};
		const usersService = {
			findUserByEmail: jest.fn().mockResolvedValue({ id: 'user-1' }),
			checkIsUserPremium: jest.fn().mockResolvedValue(false),
		};

		const service = new StripePaymentsService(
			customerModel as any,
			stripeClientService as any,
			customGeneratorService as any,
			usersService as any,
		);

		const result = await service.createCheckoutSession({
			email: 'member@example.com',
			member_id: 'user-1',
			task: 'Create a long enough authenticated task.',
			access_token: 'token',
		});

		expect(result).toEqual({ url: 'http://frontend/success', task_id: 42 });
		expect(paymentIntentCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 2500,
				customer: 'cus_123',
				off_session: true,
				confirm: true,
				metadata: expect.objectContaining({
					email: 'member@example.com',
					task_id: 42,
					member_id: 'user-1',
					webhook_id: 'gop-back',
				}),
			}),
		);
	});
});
