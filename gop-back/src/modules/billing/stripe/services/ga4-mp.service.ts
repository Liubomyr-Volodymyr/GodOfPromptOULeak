import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * GA4 Measurement Protocol sender — the SERVER-SIDE leg of the dual-tracking
 * model in the MADS dataLayer Event Specification v2.0.
 *
 * Why: the browser legs are lossy (ad-blockers, buyers who never return to
 * the thank-you page, card verification completing on Stripe's domain where
 * GTM is CSP-blocked). Webhook-driven events are the source of truth:
 *   - `purchase`             ← checkout.session.completed
 *   - `generator_card_added` ← setup_intent.succeeded
 * Deduplication key on both: `transaction_id` (identical to the browser leg).
 *
 * Config (see .env.example):
 *   GA4_MEASUREMENT_ID  — defaults to the prod web stream (G-N363X62L8Z)
 *   GA4_MP_API_SECRET   — GA4 Admin → Data Streams → Measurement Protocol
 *                         API secrets. REQUIRED: without it every send is a
 *                         logged no-op (never throws, never blocks billing).
 *
 * client_id: MP requires one, and a webhook has no browser cookie — so a
 * stable surrogate is derived from the Stripe object id (explicitly allowed
 * by the spec: "GA_CLIENT_ID_FROM_REDIRECT_OR_SURROGATE").
 *
 * No PII is ever sent: user_id = SHA-256(lowercased, trimmed email).
 */
@Injectable()
export class Ga4MeasurementProtocolService {
	private readonly logger = new Logger(Ga4MeasurementProtocolService.name);
	private readonly measurementId = process.env.GA4_MEASUREMENT_ID || 'G-N363X62L8Z';
	private readonly apiSecret = process.env.GA4_MP_API_SECRET;

	hashEmail(email?: string | null): string | undefined {
		if (!email) return undefined;
		return createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
	}

	private clientIdFrom(seed: string): string {
		const h = createHash('sha256').update(seed).digest();
		return `${h.readUInt32BE(0)}.${h.readUInt32BE(4)}`;
	}

	/** Fire-and-forget: logs failures, never throws — a GA outage or a
	 *  missing secret must never affect webhook processing / billing. */
	async send(name: string, params: Record<string, unknown>, opts: { seed: string; userId?: string }): Promise<void> {
		if (!this.apiSecret) {
			this.logger.warn(`GA4 MP: GA4_MP_API_SECRET not set — skipping '${name}'`);
			return;
		}
		const body = {
			client_id: this.clientIdFrom(opts.seed),
			...(opts.userId ? { user_id: opts.userId } : {}),
			events: [{ name, params }],
		};
		try {
			const res = await fetch(
				`https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				},
			);
			if (res.status >= 300) {
				this.logger.warn(`GA4 MP '${name}' HTTP ${res.status}`);
			} else {
				this.logger.log(`GA4 MP '${name}' sent (tx=${(params as any).transaction_id ?? 'n/a'})`);
			}
		} catch (e: any) {
			this.logger.warn(`GA4 MP '${name}' failed: ${e?.message}`);
		}
	}
}
