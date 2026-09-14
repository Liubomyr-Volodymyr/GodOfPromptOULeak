import { HttpException, HttpStatus } from '@nestjs/common';

export function toHttpError(error: unknown, fallbackMessage: string, fallbackStatus: HttpStatus = HttpStatus.BAD_GATEWAY): HttpException {
	if (error instanceof HttpException) return error;
	return new HttpException(fallbackMessage, fallbackStatus);
}
