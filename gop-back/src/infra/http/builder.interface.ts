import { AxiosRequestConfig } from 'axios';
import { HttpData, HttpMethod, HttpResponse } from './types';

export abstract class IHttpBuilder {
	abstract method(method: HttpMethod): IHttpBuilder;
	abstract url(url: string): IHttpBuilder;
	abstract body<Request extends HttpData = HttpData>(
		data: Request,
	): IHttpBuilder;
	abstract headers(headers: Record<string, string>): IHttpBuilder;
	abstract header(key: string, value: string): IHttpBuilder;
	abstract config(config: AxiosRequestConfig): IHttpBuilder;
	abstract timeout(ms: number): IHttpBuilder;
	abstract retry(retries: number): IHttpBuilder;

	abstract execute<Response = unknown>(): Promise<Response>;
	abstract safeExecute<Response = unknown>(): Promise<HttpResponse<Response>>;
}
