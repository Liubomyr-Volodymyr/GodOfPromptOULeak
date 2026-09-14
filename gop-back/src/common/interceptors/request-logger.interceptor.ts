import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const req = context.switchToHttp().getRequest();
		const user = req.user;

		console.log(`${req.method} - ${req.path}${user?.email ? ` (${user.email})` : ''}`);

		return next.handle();
	}
}
