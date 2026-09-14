import { Request, Response } from 'express';
import { Body, Controller, Post, Patch, Req, UseGuards, Get, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { EmailThrottlerGuard, JwtAuthGuard } from '../guards';
import { LoginDto, RefreshTokenDto, RegisterDto, ResendCodeDto, VerifyCodeDto, ForgotPasswordDto, TrackingDto } from '../dto';
import {
	ApiGetMe,
	ApiLogin,
	ApiRegister,
	ApiResendCode,
	ApiUpdatePassword,
	ApiVerifyCode,
	ApiForgotPassword,
	ApiResetPassword,
	ApiTrackingData,
} from '../docs';
import { ResetPasswordDto, UpdatePasswordDto } from '../../users/dto';
import { CONFIG } from '../../../config/enums';
import { UsersService } from '../../users/services/users.service';
import { TrackActivity } from '../../activity/activity.decorator';
import { ActivityTypeEnum } from '../../activity/enums/activity-type.enum';
import { UserActivityService } from '../../activity/services/user-activity.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
	constructor(
		private readonly configService: ConfigService,
		private readonly authService: AuthService,
		private readonly usersService: UsersService,
		private readonly activityService: UserActivityService,
	) {}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@TrackActivity(ActivityTypeEnum.ACCOUNT_CREATED)
	@Post('register')
	@ApiRegister()
	async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
		const { userId, ...response } = await this.authService.register(dto);
		res.locals.userId = userId;
		return response;
	}

	@Post('register/tracking')
	@ApiTrackingData()
	@ApiBearerAuth('access_token')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async addTracking(@Body() dto: TrackingDto, @Req() req: Request) {
		return this.usersService.addTrackingData(req.user.userId, dto.tracking);
	}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@Post('login')
	@TrackActivity(ActivityTypeEnum.LOGIN)
	@ApiLogin()
	async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
		const { userId, ...tokens } = await this.authService.login(dto);
		res.locals.userId = userId;
		return tokens;
	}

	@Post('refresh')
	async refreshToken(@Body() dto: RefreshTokenDto) {
		return this.authService.refreshToken(dto);
	}

	@Get('google/web')
	@UseGuards(AuthGuard('google-web'))
	async googleWebAuth() {}

	@Get('google/web/callback')
	@UseGuards(AuthGuard('google-web'))
	async googleWebCallback(@Req() req: Request, @Res() res: Response) {
		await this.usersService.updateLastLoginDate(req?.user.userId);
		const tokens = this.authService.issueTokenFor(req.user);
		await this.activityService.track({
			user_id: req.user.userId,
			user: req.user.userId,
			type: ActivityTypeEnum.GOOGLE_LOGIN,
			path: 'google/web/callback',
			method: 'GET',
			status: 302,
		});
		const frontendUrl = this.configService.get(CONFIG.FRONTEND_URL);
		res.redirect(`${frontendUrl}/auth/google/callback?token=${tokens.access_token}`);
	}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@Post('forgot-password')
	@ApiForgotPassword()
	@UseGuards(EmailThrottlerGuard)
	async forgotPassword(@Body() dto: ForgotPasswordDto) {
		return await this.authService.forgotPassword(dto);
	}

	@Patch('reset-password')
	@TrackActivity(ActivityTypeEnum.RESET_PASSWORD)
	@ApiResetPassword()
	async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) res: Response) {
		const result = await this.authService.resetPassword(dto);
		res.locals.userId = result.userId;
		return result;
	}

	@Patch('update-password')
	@TrackActivity(ActivityTypeEnum.UPDATE_PASSWORD)
	@ApiUpdatePassword()
	@ApiBearerAuth('access_token')
	@UseGuards(JwtAuthGuard)
	async updatePassword(@Body() dto: UpdatePasswordDto, @Req() req: Request) {
		const userId = req.user.userId;
		return await this.usersService.updatePassword(userId, dto);
	}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@UseGuards(EmailThrottlerGuard)
	@Post('verify-code')
	@ApiVerifyCode()
	async verifyCode(@Body() dto: VerifyCodeDto) {
		return this.authService.verifyCode(dto);
	}

	@Throttle({ default: { limit: 30, ttl: 60000 } })
	@UseGuards(EmailThrottlerGuard)
	@Post('resend-code')
	@ApiResendCode()
	async resendCode(@Body() dto: ResendCodeDto) {
		return this.authService.resendCode(dto.email);
	}

	@Get('me')
	@ApiGetMe()
	@ApiBearerAuth('access_token')
	@UseGuards(JwtAuthGuard)
	async getProfile(@Req() req: Request) {
		return await this.usersService.getProfile(req.user.email);
	}
}
