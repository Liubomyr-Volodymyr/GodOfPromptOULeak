import { Injectable } from '@nestjs/common';
import { ErrorLogData } from '../dto/logger.dto';
import { IAppLogger } from '../logger.interface';

@Injectable()
export class LoggerService implements IAppLogger {
	private maskSensitiveData(data: any): any {
		if (!data) return data;
		const maskedData = { ...data };

		const sensitiveFields = ['password', 'token', 'credit_card', 'stripe_token', 'API-KEY', 'API_KEY', 'access_token'];

		for (const field of sensitiveFields) {
			if (field in maskedData) {
				maskedData[field] = '[MASKED]';
			}
		}

		return maskedData;
	}

	info(message: string, context?: any): void {
		let log: any = { message };

		if (context) {
			if (typeof context === 'object') {
				log.context = this.maskSensitiveData(context);
			} else {
				log.context = context;
			}
		}

		console.log(log);
	}

	error(error: ErrorLogData): void {
		if (this.shouldSkipLogging(error)) {
			return;
		}

		const maskedBody = this.maskSensitiveData(error.body);
		const maskedQuery = this.maskSensitiveData(error.query);

		console.error({
			statusCode: error.statusCode,
			path: error.path,
			method: error.method,
			...(Object.keys(maskedBody || {}).length > 0 && {
				body: maskedBody,
			}),
			...(Object.keys(maskedQuery || {}).length > 0 && {
				query: maskedQuery,
			}),
			message: error.message,
		});
	}

	private shouldSkipLogging(error: ErrorLogData): boolean {
		return error.body && 'triggerType' in error.body;
	}
}
