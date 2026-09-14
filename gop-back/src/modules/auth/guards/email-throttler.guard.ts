import { Injectable } from '@nestjs/common';
import { ThrottlerGuard as BaseThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class EmailThrottlerGuard extends BaseThrottlerGuard {
	protected async getTracker(req: Record<string, any>): Promise<string> {
		if (req.body?.email) {
			return req.body.email.toLowerCase();
		}

		return req.ip;
	}
}
