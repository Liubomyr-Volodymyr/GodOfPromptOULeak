import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { LoggerService } from '../../infra/logger/services/logger.service';

interface HttpExceptionResponse {
	message?: string | string[];
	error?: string;
	statusCode?: number;
	[key: string]: any;
}

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	constructor(private readonly loggerService: LoggerService) {}

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();

		let status = HttpStatus.INTERNAL_SERVER_ERROR;
		let message = 'Internal Server Error';
		let errors: string[] = [];
		let upstream: { url?: string; method?: string; status?: number; body?: unknown } | undefined;

		if (exception instanceof HttpException) {
			status = exception.getStatus();
			const exceptionResponse = exception.getResponse() as HttpExceptionResponse;

			const responseMessage =
				typeof exceptionResponse === 'object' ? exceptionResponse.message || exceptionResponse.error : exceptionResponse;

			message = Array.isArray(responseMessage) ? responseMessage.join('; ') : String(responseMessage);

			errors = Array.isArray(responseMessage) ? responseMessage : [message];
		} else if (isAxiosError(exception)) {
			const upstreamStatus = exception.response?.status;
			const upstreamBody = exception.response?.data;
			const extracted = extractAxiosMessages(upstreamBody, exception.message);

			status = upstreamStatus ?? HttpStatus.BAD_GATEWAY;
			errors = extracted;
			message = extracted.join('; ');

			upstream = {
				url: exception.config?.url,
				method: exception.config?.method,
				status: upstreamStatus,
				body: upstreamBody,
			};
		} else if (exception instanceof Error) {
			message = exception.message;
			errors = [message];
		}

		this.loggerService.error({
			statusCode: status,
			path: request.url,
			method: request.method,
			body: request.body,
			query: request.query,
			message: message,
			...(upstream && { upstream }),
		});

		response.status(status).json({
			success: false,
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.url,
			message: message,
			errors: errors,
		});
	}
}

function extractAxiosMessages(body: unknown, fallback: string): string[] {
	if (body && typeof body === 'object') {
		const obj = body as Record<string, any>;

		if (Array.isArray(obj.errors)) {
			const msgs = obj.errors
				.map((e) => (typeof e === 'string' ? e : e?.message))
				.filter((m): m is string => typeof m === 'string' && m.length > 0);
			if (msgs.length) return msgs;
		}

		if (Array.isArray(obj.message)) {
			const msgs = obj.message.filter((m: unknown): m is string => typeof m === 'string');
			if (msgs.length) return msgs;
		}

		if (typeof obj.message === 'string' && obj.message) return [obj.message];
		if (typeof obj.error === 'string' && obj.error) return [obj.error];
	}

	if (typeof body === 'string' && body) return [body];

	return [fallback];
}
