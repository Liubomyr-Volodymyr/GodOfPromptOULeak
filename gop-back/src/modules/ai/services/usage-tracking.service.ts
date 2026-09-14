import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { IFieldUsage, IUsageSummary } from '../interfaces/usage-tracking.interfaces';
import { CONFIG } from '../../../config/enums';

const REDIS_KEY_PREFIX: string = 'prompt:usage:';
const REDIS_TTL_SECONDS: number = 3600;

@Injectable()
export class UsageTrackingService implements OnModuleDestroy {
	private readonly logger: Logger = new Logger(UsageTrackingService.name);
	private readonly redis: Redis;

	constructor() {
		this.redis = new Redis({
			host: process.env[CONFIG.REDIS_HOST] || 'redis',
			port: +process.env[CONFIG.REDIS_PORT] || 6379,
			username: process.env[CONFIG.REDIS_USER],
			password: process.env[CONFIG.REDIS_PASSWORD],
			family: 0,
		});
	}

	async onModuleDestroy(): Promise<void> {
		await this.redis.quit();
	}

	async logFieldUsage(trackingId: string, usage: IFieldUsage): Promise<void> {
		const key: string = `${REDIS_KEY_PREFIX}${trackingId}`;

		try {
			const serialized: string = JSON.stringify(usage);
			await this.redis.rpush(key, serialized);
			await this.redis.expire(key, REDIS_TTL_SECONDS);
		} catch (error: any) {
			this.logger.error(`Failed to log field usage for ${trackingId}: ${error?.message}`);
		}
	}

	async getUsageSummary(trackingId: string): Promise<IUsageSummary> {
		const key: string = `${REDIS_KEY_PREFIX}${trackingId}`;

		try {
			const entries: string[] = await this.redis.lrange(key, 0, -1);
			const fields: IFieldUsage[] = entries.map((entry: string): IFieldUsage => JSON.parse(entry) as IFieldUsage);

			const totalInputTokens: number = fields.reduce((sum: number, f: IFieldUsage): number => sum + f.inputTokens, 0);
			const totalOutputTokens: number = fields.reduce((sum: number, f: IFieldUsage): number => sum + f.outputTokens, 0);
			const totalCost: number = fields.reduce((sum: number, f: IFieldUsage): number => sum + f.cost, 0);

			return { totalInputTokens, totalOutputTokens, totalCost, fields };
		} catch (error: any) {
			this.logger.error(`Failed to get usage summary for ${trackingId}: ${error?.message}`);
			return { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0, fields: [] };
		}
	}

	async cleanup(trackingId: string): Promise<void> {
		const key: string = `${REDIS_KEY_PREFIX}${trackingId}`;

		try {
			await this.redis.del(key);
		} catch (error: any) {
			this.logger.error(`Failed to cleanup usage for ${trackingId}: ${error?.message}`);
		}
	}
}
