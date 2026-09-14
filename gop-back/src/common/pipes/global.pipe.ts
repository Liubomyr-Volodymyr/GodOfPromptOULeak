import { ValidationPipe } from '@nestjs/common';

export const GlobalPipesConfig = new ValidationPipe({
	whitelist: true,
	forbidNonWhitelisted: true,
	transform: true,
	disableErrorMessages: false,
	validateCustomDecorators: true,
});
