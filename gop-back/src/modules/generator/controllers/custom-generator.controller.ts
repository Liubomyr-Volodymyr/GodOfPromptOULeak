import { Body, Controller, Post, Get, Param, ParseIntPipe, Logger, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CustomGeneratorService } from '../services/custom-generator.service';
import { CreateCustomPromptDto, ITaskStatusResponse } from '../dto/generator.dto';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../../users/services/users.service';
import { StripePaymentsService } from '../../billing/stripe/services/stripe-payments.service';
import { CheckoutSessionDto } from '../../billing/stripe/dto/customer-checkout.dto';
import { EmailThrottlerGuard } from '../../auth/guards/email-throttler.guard';

@ApiTags('Generator')
@Controller('generator')
export class CustomGeneratorController {
	private readonly logger = new Logger(CustomGeneratorController.name);

	constructor(
		private readonly customGeneratorService: CustomGeneratorService,
		private readonly usersService: UsersService,
		private readonly stripePaymentsService: StripePaymentsService,
	) {}

	@Post('custom-prompt-generate')
	@UseGuards(EmailThrottlerGuard)
	@Throttle({ default: { limit: 30, ttl: 3600000 } })
	async customPromptGenerate(@Body() dataDto: CreateCustomPromptDto): Promise<CheckoutSessionDto> {
		const email = dataDto.email;

		const user = await this.usersService.findOrCreateByEmail(email);
		this.logger.log(`[custom-prompt] email=${email}, userId=${user?.id}, isNew=${!user?.isVerified}`);

		return this.stripePaymentsService.createCheckoutSession({
			email,
			task: dataDto.task,
			member_id: user?.id,
			prompt_type: dataDto.prompt_type,
		});
	}

	@Get('task-status/:taskId')
	async getTaskStatus(@Param('taskId', ParseIntPipe) taskId: number): Promise<ITaskStatusResponse> {
		return this.customGeneratorService.getTaskStatus(taskId);
	}
}
