import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { tap } from 'rxjs/operators';
import { UserActivityService } from './services/user-activity.service';
import { TRACK_ACTIVITY_KEY } from './activity.decorator';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
	constructor(
		private readonly reflector: Reflector,
		private readonly activityService: UserActivityService,
	) {}

	intercept(context: ExecutionContext, next: CallHandler) {
		const meta = this.reflector.getAllAndOverride(TRACK_ACTIVITY_KEY, [context.getHandler(), context.getClass()]);

		if (!meta) {
			return next.handle();
		}

		const request: Request = context.switchToHttp().getRequest<Request>();
		const response: Response = context.switchToHttp().getResponse<Response>();

		return next.handle().pipe(
			tap(() => {
				const userId = response.locals?.userId ?? request.user?.userId ?? null;

				void this.activityService.track({
					user_id: userId,
					user: userId,
					type: meta.type,
					method: request.method,
					path: request.originalUrl,
					status: response.statusCode,
				});
			}),
		);
	}
}
