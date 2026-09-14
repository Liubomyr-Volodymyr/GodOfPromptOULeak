import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { StripePaymentsService } from '../services/stripe-payments.service';
import { CheckoutSessionAttrs, CheckoutSessionDto } from '../dto/customer-checkout.dto';

@SkipThrottle()
@ApiTags('Stripe billing')
@Controller('stripe')
export class StripeCheckoutController {
	constructor(
		private readonly stripePaymentsService: StripePaymentsService,
		private readonly jwtService: JwtService,
	) {}

	@Post('create-checkout-session')
	async createCheckoutSession(@Body() dataDto: CheckoutSessionAttrs): Promise<CheckoutSessionDto> {
		let payload: any;
		try {
			payload = await this.jwtService.verifyAsync(dataDto.access_token);
		} catch (_error) {
			throw new UnauthorizedException('Invalid access token');
		}

		if (!payload || !payload.sub || !payload.email) {
			throw new UnauthorizedException('Invalid token payload');
		}

		const email = payload.email;
		const member_id = payload.sub;

		return this.stripePaymentsService.createCheckoutSession({
			...dataDto,
			email,
			member_id,
		});
	}
}
