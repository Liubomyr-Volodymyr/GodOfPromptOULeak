import 'reflect-metadata';
import { writeFileSync } from 'fs';
import Stripe from 'stripe';
import { DataSource, IsNull, Repository } from 'typeorm';
import dataSource from '../orm.config';
import { Orders, OrderStatusEnum, OrderTypeEnum } from '../src/modules/orders/entities/orders.entity';
import { User } from '../src/modules/users/entities/users.entity';
import { UserEmails } from '../src/modules/users/entities/user-emails.entity';
import { ProductPrices } from '../src/modules/user-products/entities/product-prices.entity';

const STRIPE_API_VERSION = '2025-02-24.acacia';
const PAGE_SIZE = 100;

interface IBackfillOptions {
	apply: boolean;
	enrich: boolean;
	fromUnix?: number;
	toUnix?: number;
	maxCharges?: number;
	unmatchedReportPath: string;
}

interface IUnmatchedCharge {
	charge_id: string;
	payment_intent_id: string | null;
	amount: number;
	currency: string;
	paid_at: string;
	email: string | null;
	customer_id: string | null;
	reason: string;
}

interface IBackfillSummary {
	scanned: number;
	skippedNotSucceeded: number;
	skippedZeroAmount: number;
	alreadyPresent: number;
	inserted: number;
	unmatchedUser: number;
	unresolvedPrice: number;
}

function parseOptions(argv: string[]): IBackfillOptions {
	const flag = (name: string): string | undefined => {
		const found: string | undefined = argv.find((arg: string): boolean => arg.startsWith(`--${name}=`));
		return found ? found.split('=').slice(1).join('=') : undefined;
	};

	const toUnixSeconds = (value?: string): number | undefined => {
		if (!value) return undefined;
		const parsed: number = Date.parse(value);
		if (Number.isNaN(parsed)) throw new Error(`Invalid date: ${value}`);
		return Math.floor(parsed / 1000);
	};

	const maxCharges: string | undefined = flag('max');

	return {
		apply: argv.includes('--apply'),
		enrich: argv.includes('--enrich'),
		fromUnix: toUnixSeconds(flag('from')),
		toUnix: toUnixSeconds(flag('to')),
		maxCharges: maxCharges ? Number(maxCharges) : undefined,
		unmatchedReportPath: flag('report') ?? './backfill-orders-unmatched.json',
	};
}

function resolveStripeClient(): Stripe {
	const secretKey: string | undefined = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) throw new Error('No STRIPE_SECRET_KEY in env');

	return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
}

function toObjectId(value: string | { id: string } | null | undefined): string | null {
	if (!value) return null;
	return typeof value === 'string' ? value : value.id;
}

function mergeMetadata(charge: Stripe.Charge): Record<string, string> {
	const paymentIntent: Stripe.PaymentIntent | null =
		charge.payment_intent && typeof charge.payment_intent !== 'string' ? charge.payment_intent : null;
	const invoice: Stripe.Invoice | null = charge.invoice && typeof charge.invoice !== 'string' ? charge.invoice : null;

	return {
		...(invoice?.metadata ?? {}),
		...(paymentIntent?.metadata ?? {}),
		...(charge.metadata ?? {}),
	};
}

function resolveOrderType(invoice: Stripe.Invoice | null): OrderTypeEnum {
	if (!invoice) return OrderTypeEnum.ONE_TIME;
	return invoice.billing_reason === 'subscription_create' ? OrderTypeEnum.SUBSCRIPTION : OrderTypeEnum.RENEWAL;
}

function resolveOrderStatus(amountInCents: number, refundedInCents: number): OrderStatusEnum {
	if (refundedInCents <= 0) return OrderStatusEnum.PAID;
	return refundedInCents >= amountInCents ? OrderStatusEnum.REFUNDED : OrderStatusEnum.PARTIALLY_REFUNDED;
}

function toMajorUnits(amountInCents: number): number {
	return Number(((amountInCents ?? 0) / 100).toFixed(2));
}

// the custom-prompt flow bills a fixed price straight off a payment intent and, before price_id was added
// to its metadata, task_id was the only marker of which price was charged
function customPromptPriceId(metadata: Record<string, string>): string | null {
	return metadata.task_id ? (process.env.STRIPE_PRICE_ID ?? null) : null;
}

async function resolvePriceIdFromIntent(stripe: Stripe, paymentIntentId: string | null): Promise<string | null> {
	if (!paymentIntentId) return null;

	try {
		const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
		const metadata: Record<string, string> = paymentIntent.metadata ?? {};

		return metadata.price_id ?? customPromptPriceId(metadata);
	} catch (error) {
		console.warn(`intent lookup failed for ${paymentIntentId}: ${(error as Error).message}`);
		return null;
	}
}

// charges made outside our checkout flow carry empty metadata; the session behind them still lists the price
async function resolvePriceIdFromSession(stripe: Stripe, paymentIntentId: string | null): Promise<string | null> {
	if (!paymentIntentId) return null;

	try {
		const sessions: Stripe.ApiList<Stripe.Checkout.Session> = await stripe.checkout.sessions.list({
			payment_intent: paymentIntentId,
			limit: 1,
			expand: ['data.line_items'],
		});

		return sessions.data[0]?.line_items?.data?.[0]?.price?.id ?? null;
	} catch (error) {
		console.warn(`session lookup failed for ${paymentIntentId}: ${(error as Error).message}`);
		return null;
	}
}

class UserResolver {
	private readonly byCustomerId = new Map<string, string | null>();
	private readonly byEmail = new Map<string, string | null>();
	private readonly knownUserIds = new Set<string>();

	constructor(
		private readonly usersRepo: Repository<User>,
		private readonly userEmailsRepo: Repository<UserEmails>,
	) {}

	async resolve(userIdFromMetadata: string | undefined, customerId: string | null, email: string | null): Promise<string | null> {
		if (userIdFromMetadata && (await this.userExists(userIdFromMetadata))) return userIdFromMetadata;

		if (customerId) {
			const byCustomer: string | null = await this.resolveByCustomerId(customerId);
			if (byCustomer) return byCustomer;
		}

		if (email) return this.resolveByEmail(email);

		return null;
	}

	private async userExists(userId: string): Promise<boolean> {
		if (this.knownUserIds.has(userId)) return true;

		const user: User | null = await this.usersRepo.findOne({ where: { id: userId }, select: { id: true } });
		if (!user) return false;

		this.knownUserIds.add(user.id);
		return true;
	}

	private async resolveByCustomerId(customerId: string): Promise<string | null> {
		if (this.byCustomerId.has(customerId)) return this.byCustomerId.get(customerId) ?? null;

		const user: User | null = await this.usersRepo.findOne({
			where: { stripeCustomerId: customerId },
			select: { id: true },
		});

		this.byCustomerId.set(customerId, user?.id ?? null);
		return user?.id ?? null;
	}

	private async resolveByEmail(email: string): Promise<string | null> {
		const normalized: string = email.trim().toLowerCase();
		if (this.byEmail.has(normalized)) return this.byEmail.get(normalized) ?? null;

		const user: User | null = await this.usersRepo
			.createQueryBuilder('user')
			.select('user.id')
			.where('LOWER(user.email) = :email', { email: normalized })
			.getOne();

		if (user) {
			this.byEmail.set(normalized, user.id);
			return user.id;
		}

		const userEmail: UserEmails | null = await this.userEmailsRepo
			.createQueryBuilder('userEmail')
			.leftJoin('userEmail.user', 'user')
			.select(['userEmail.id', 'user.id'])
			.where('LOWER(userEmail.email) = :email', { email: normalized })
			.getOne();

		const resolvedId: string | null = userEmail?.user?.id ?? null;
		this.byEmail.set(normalized, resolvedId);
		return resolvedId;
	}
}

async function loadPriceMap(pricesRepo: Repository<ProductPrices>): Promise<Map<string, ProductPrices>> {
	const prices: ProductPrices[] = await pricesRepo.find({ relations: { product: true } });
	const priceMap = new Map<string, ProductPrices>();

	for (const price of prices) {
		if (price.stripePriceId) priceMap.set(price.stripePriceId, price);
	}

	return priceMap;
}

async function enrichMissingPrices(
	stripe: Stripe,
	options: IBackfillOptions,
	ordersRepo: Repository<Orders>,
	priceMap: Map<string, ProductPrices>,
): Promise<void> {
	const orders: Orders[] = await ordersRepo.find({ where: { stripePriceId: IsNull() } });
	console.log(`orders without stripe_price_id: ${orders.length}`);

	let resolvedFromSession = 0;
	let matchedInCatalog = 0;

	for (const order of orders) {
		const stripePriceId: string | null =
			(await resolvePriceIdFromSession(stripe, order.stripePaymentIntent)) ??
			(await resolvePriceIdFromIntent(stripe, order.stripePaymentIntent));

		if (!stripePriceId) continue;

		resolvedFromSession += 1;

		const price: ProductPrices | undefined = priceMap.get(stripePriceId);
		if (price) matchedInCatalog += 1;

		order.stripePriceId = stripePriceId;
		order.price = price ?? null;
		order.product = price?.product ?? null;

		if (options.apply) await ordersRepo.save(order);
	}

	console.log('\n=== enrich summary ===');
	console.log(`price id recovered        : ${resolvedFromSession}`);
	console.log(`matched to catalog price  : ${matchedInCatalog}`);
	console.log(`orders ${options.apply ? 'updated' : 'planned'}           : ${resolvedFromSession}`);
}

async function loadExistingKeys(ordersRepo: Repository<Orders>): Promise<Set<string>> {
	const existing: Orders[] = await ordersRepo.find({
		select: { id: true, stripePaymentIntent: true, stripeInvoiceId: true },
	});

	const keys = new Set<string>();

	for (const order of existing) {
		if (order.stripePaymentIntent) keys.add(order.stripePaymentIntent);
		if (order.stripeInvoiceId) keys.add(order.stripeInvoiceId);
	}

	return keys;
}

async function backfillCharges(
	stripe: Stripe,
	options: IBackfillOptions,
	ordersRepo: Repository<Orders>,
	userResolver: UserResolver,
	priceMap: Map<string, ProductPrices>,
	existingKeys: Set<string>,
	unmatched: IUnmatchedCharge[],
	summary: IBackfillSummary,
): Promise<void> {
	const created: Stripe.RangeQueryParam = {};
	if (options.fromUnix) created.gte = options.fromUnix;
	if (options.toUnix) created.lte = options.toUnix;

	const params: Stripe.ChargeListParams = {
		limit: PAGE_SIZE,
		expand: ['data.invoice', 'data.payment_intent'],
		...(options.fromUnix || options.toUnix ? { created } : {}),
	};

	for await (const charge of stripe.charges.list(params)) {
		summary.scanned += 1;

		if (options.maxCharges && summary.scanned > options.maxCharges) return;

		if (charge.status !== 'succeeded' || !charge.paid) {
			summary.skippedNotSucceeded += 1;
			continue;
		}

		if (!charge.amount) {
			summary.skippedZeroAmount += 1;
			continue;
		}

		const invoice: Stripe.Invoice | null = charge.invoice && typeof charge.invoice !== 'string' ? charge.invoice : null;
		const paymentIntentId: string | null = toObjectId(charge.payment_intent);
		const invoiceId: string | null = invoice?.id ?? toObjectId(charge.invoice);

		const idempotencyKey: string | null = paymentIntentId ?? invoiceId;
		if (idempotencyKey && existingKeys.has(idempotencyKey)) {
			summary.alreadyPresent += 1;
			continue;
		}

		const metadata: Record<string, string> = mergeMetadata(charge);
		const customerId: string | null = toObjectId(charge.customer);
		const email: string | null = charge.billing_details?.email ?? charge.receipt_email ?? metadata.email ?? null;

		const userId: string | null = await userResolver.resolve(metadata.user_id, customerId, email);

		if (!userId) {
			summary.unmatchedUser += 1;
			unmatched.push({
				charge_id: charge.id,
				payment_intent_id: paymentIntentId,
				amount: toMajorUnits(charge.amount),
				currency: charge.currency.toUpperCase(),
				paid_at: new Date(charge.created * 1000).toISOString(),
				email,
				customer_id: customerId,
				reason: 'no matching user in our database',
			});
			continue;
		}

		const stripePriceId: string | null =
			invoice?.lines?.data?.[0]?.price?.id ??
			metadata.price_id ??
			customPromptPriceId(metadata) ??
			(await resolvePriceIdFromSession(stripe, paymentIntentId));
		const price: ProductPrices | undefined = stripePriceId ? priceMap.get(stripePriceId) : undefined;

		if (!price) summary.unresolvedPrice += 1;

		const refundedInCents: number = charge.amount_refunded ?? 0;
		const refundCreated: number | undefined = charge.refunds?.data?.[0]?.created;

		const order: Orders = ordersRepo.create({
			user: { id: userId },
			product: price?.product ?? null,
			price: price ?? null,
			amount: toMajorUnits(charge.amount),
			refundedAmount: toMajorUnits(refundedInCents),
			currency: charge.currency.toUpperCase(),
			type: resolveOrderType(invoice),
			status: resolveOrderStatus(charge.amount, refundedInCents),
			stripePriceId,
			stripePaymentIntent: paymentIntentId,
			stripeInvoiceId: invoiceId,
			stripeSubscriptionId: toObjectId(invoice?.subscription),
			stripeCustomerId: customerId,
			purchaseUtmSource: metadata.utm_source ?? null,
			purchaseUtmMedium: metadata.utm_medium ?? null,
			purchaseUtmCampaign: metadata.utm_campaign ?? null,
			paidAt: new Date(charge.created * 1000),
			refundedAt: refundedInCents > 0 ? new Date((refundCreated ?? charge.created) * 1000) : null,
		});

		if (options.apply) await ordersRepo.save(order);

		if (idempotencyKey) existingKeys.add(idempotencyKey);
		summary.inserted += 1;

		if (summary.inserted % 200 === 0) {
			console.log(`${summary.inserted} orders ${options.apply ? 'written' : 'planned'}…`);
		}
	}
}

async function main(): Promise<void> {
	const options: IBackfillOptions = parseOptions(process.argv.slice(2));
	const stripe: Stripe = resolveStripeClient();

	console.log(`Mode: ${options.enrich ? 'ENRICH' : 'BACKFILL'} / ${options.apply ? 'APPLY (writes orders)' : 'DRY RUN (no writes)'}`);

	const connection: DataSource = await dataSource.initialize();

	try {
		const ordersRepo: Repository<Orders> = connection.getRepository(Orders);
		const usersRepo: Repository<User> = connection.getRepository(User);
		const userEmailsRepo: Repository<UserEmails> = connection.getRepository(UserEmails);
		const pricesRepo: Repository<ProductPrices> = connection.getRepository(ProductPrices);

		const priceMap: Map<string, ProductPrices> = await loadPriceMap(pricesRepo);

		if (options.enrich) {
			await enrichMissingPrices(stripe, options, ordersRepo, priceMap);
			return;
		}

		const existingKeys: Set<string> = await loadExistingKeys(ordersRepo);
		const userResolver = new UserResolver(usersRepo, userEmailsRepo);

		const unmatched: IUnmatchedCharge[] = [];
		const summary: IBackfillSummary = {
			scanned: 0,
			skippedNotSucceeded: 0,
			skippedZeroAmount: 0,
			alreadyPresent: 0,
			inserted: 0,
			unmatchedUser: 0,
			unresolvedPrice: 0,
		};

		await backfillCharges(stripe, options, ordersRepo, userResolver, priceMap, existingKeys, unmatched, summary);

		if (unmatched.length) {
			writeFileSync(options.unmatchedReportPath, JSON.stringify(unmatched, null, 2));
		}

		console.log('\n=== summary ===');
		console.log(`scanned charges       : ${summary.scanned}`);
		console.log(`skipped (not paid)    : ${summary.skippedNotSucceeded}`);
		console.log(`skipped (zero amount) : ${summary.skippedZeroAmount}`);
		console.log(`already in orders     : ${summary.alreadyPresent}`);
		console.log(`orders ${options.apply ? 'written       ' : 'planned       '}: ${summary.inserted}`);
		console.log(`unmatched users       : ${summary.unmatchedUser}${unmatched.length ? ` -> ${options.unmatchedReportPath}` : ''}`);
		console.log(`orders without price  : ${summary.unresolvedPrice}`);
	} finally {
		await connection.destroy();
	}
}

main().catch((error: Error): void => {
	console.error(error);
	process.exit(1);
});
