import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CONFIG } from '../../config/enums';

export interface BeehiivPublication {
	name: string;
	id: string;
}

@Injectable()
export class BeehiivService {
	private readonly http: AxiosInstance;
	private readonly publications: BeehiivPublication[];

	constructor(private readonly config: ConfigService) {
		const apiKey = config.get<string>(CONFIG.BEEHIIV_API_KEY) ?? '';

		this.http = axios.create({
			baseURL: 'https://api.beehiiv.com/v2',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
		});

		this.publications = [
			{ name: 'GOP_PRODUCTS', id: config.get<string>(CONFIG.BEEHIIV_PUBLICATION_GOP_PRODUCTS) ?? '' },
			{ name: 'GOP_MAIN', id: config.get<string>(CONFIG.BEEHIIV_PUBLICATION_GOP_MAIN) ?? '' },
		].filter((p) => !!p.id);
	}

	isEnabled(): boolean {
		return !!this.config.get<string>(CONFIG.BEEHIIV_API_KEY);
	}

	getPublications(): BeehiivPublication[] {
		return this.publications;
	}

	async getSubscriberByEmail(email: string, publicationId: string): Promise<any | null> {
		try {
			const encodedEmail = encodeURIComponent(email.trim());
			const { data } = await this.http.get(`/publications/${publicationId}/subscriptions/by_email/${encodedEmail}`, {
				params: { 'expand[]': 'custom_fields' },
			});
			return data;
		} catch (error: any) {
			if (error.response?.status === 404) return null;
			throw error;
		}
	}

	async createSubscriber(opts: {
		email: string;
		publicationId: string;
		utmSource?: string;
		utmMedium?: string;
		utmCampaign?: string;
		productSlug?: string;
	}): Promise<any> {
		const payload: Record<string, any> = {
			email: opts.email.toLowerCase().trim(),
			reactivate_existing: true,
			send_welcome_email: false,
		};

		if (opts.utmSource) payload.utm_source = opts.utmSource;
		if (opts.utmMedium) payload.utm_medium = opts.utmMedium;
		if (opts.utmCampaign) payload.utm_campaign = opts.utmCampaign;

		const customFields: { name: string; value: any }[] = [];
		if (opts.utmSource) customFields.push({ name: 'first_utm_source', value: opts.utmSource });
		if (opts.utmMedium) customFields.push({ name: 'first_utm_medium', value: opts.utmMedium });
		if (opts.utmCampaign) customFields.push({ name: 'first_utm_campaign', value: opts.utmCampaign });
		if (opts.productSlug) customFields.push({ name: 'lead_magnet_slug', value: [opts.productSlug] });
		if (customFields.length) payload.custom_fields = customFields;

		const { data } = await this.http.post(`/publications/${opts.publicationId}/subscriptions`, payload);
		return data;
	}

	async updateCustomField(subscriberId: string, fieldName: string, value: any, publicationId: string): Promise<any> {
		const { data } = await this.http.patch(`/publications/${publicationId}/subscriptions/${subscriberId}`, {
			custom_fields: [{ name: fieldName, value }],
		});
		return data;
	}
}
