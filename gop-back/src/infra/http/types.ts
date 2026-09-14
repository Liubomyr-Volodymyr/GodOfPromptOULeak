import { HttpException } from '@nestjs/common';

export type HttpMethod =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'PATCH'
	| 'DELETE'
	| 'HEAD'
	| 'OPTIONS';

export type HttpData =
	| Record<string, unknown>
	| string
	| number
	| boolean
	| null
	| undefined;

export interface HttpResponse<T = unknown> {
	data: T | null;
	error: HttpException | null;
	headers: Record<string, string>;
	status: number;
	success: boolean;
	duration: number;
}
