import { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';

import { IHttpBuilder } from './builder.interface';
import { HttpData, HttpMethod, HttpResponse } from './types';
import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	InternalServerErrorException,
	NotFoundException,
	RequestTimeoutException,
	UnauthorizedException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';

export class HttpBuilder implements IHttpBuilder {
	private requestConfig: {
		method: HttpMethod;
		url: string;
		data?: HttpData;
		headers: Record<string, string>;
		axiosConfig: AxiosRequestConfig;
		retries: number;
	};

	constructor(private readonly axiosInstance: AxiosInstance) {
		this.requestConfig = {
			method: 'GET',
			url: '',
			headers: {},
			axiosConfig: {},
			retries: 0,
		};
	}

	method(method: HttpMethod): this {
		this.requestConfig.method = method;
		return this;
	}

	url(url: string): this {
		this.requestConfig.url = url;
		return this;
	}

	body<Request extends HttpData = HttpData>(data: Request): this {
		this.requestConfig.data = data;
		return this;
	}

	headers(headers: Record<string, string>): this {
		this.requestConfig.headers = {
			...this.requestConfig.headers,
			...headers,
		};
		return this;
	}

	header(key: string, value: string): this {
		this.requestConfig.headers[`${key}`] = value;
		return this;
	}

	config(config: AxiosRequestConfig): this {
		this.requestConfig.axiosConfig = {
			...this.requestConfig.axiosConfig,
			...config,
		};
		return this;
	}

	timeout(ms: number): this {
		this.requestConfig.axiosConfig.timeout = ms;
		return this;
	}

	retry(retries: number): this {
		this.requestConfig.retries = retries;
		return this;
	}

	async execute<Response = unknown>(): Promise<Response> {
		const startTime = Date.now();

		try {
			const response = await this.axiosInstance({
				method: this.requestConfig.method,
				url: this.requestConfig.url,
				data: this.requestConfig.data,
				headers: this.requestConfig.headers,
				...this.requestConfig.axiosConfig,
			});

			return response.data;
		} catch (error) {
			const duration = Date.now() - startTime;
			throw this.convertToApiException(error, duration);
		}
	}

	async safeExecute<Response = unknown>(): Promise<HttpResponse<Response>> {
		const startTime = Date.now();

		try {
			const response = await this.axiosInstance({
				method: this.requestConfig.method,
				url: this.requestConfig.url,
				data: this.requestConfig.data,
				headers: this.requestConfig.headers,
				...this.requestConfig.axiosConfig,
			});

			return {
				data: response.data,
				error: null,
				headers: response.headers as Record<string, string>,
				status: response.status,
				success: true,
				duration: Date.now() - startTime,
			};
		} catch (error) {
			const duration = Date.now() - startTime;
			const apiError = this.convertToApiException(error, duration);

			return {
				data: null,
				error: apiError,
				headers: ((error as AxiosError)?.response?.headers ||
					{}) as Record<string, string>,
				status: (error as AxiosError)?.response?.status || 500,
				success: false,
				duration,
			};
		}
	}

	private convertToApiException(
		error: unknown,
		duration: number,
	): HttpException {
		const axiosError = error as AxiosError;

		const status =
			axiosError?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;

		const msg =
			(axiosError?.response?.data as any)?.message ??
			axiosError.message ??
			'Unexpected error';

		const message = `${msg} (duration: ${duration}ms)`;

		switch (status) {
			case HttpStatus.BAD_REQUEST:
				return new BadRequestException(message);
			case HttpStatus.UNAUTHORIZED:
				return new UnauthorizedException(message);
			case HttpStatus.FORBIDDEN:
				return new ForbiddenException(message);
			case HttpStatus.NOT_FOUND:
				return new NotFoundException(message);
			case HttpStatus.REQUEST_TIMEOUT:
				return new RequestTimeoutException(message);
			case HttpStatus.CONFLICT:
				return new ConflictException(message);
			case HttpStatus.UNPROCESSABLE_ENTITY:
				return new UnprocessableEntityException(message);
			default:
				return new InternalServerErrorException(message);
		}
	}
}
