import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthAdminService } from './services/auth-admin.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ApiAdminLogin } from '../../common/docs';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@ApiTags('Admin Auth')
@Controller()
export class AuthAdminController {
	constructor(private readonly authService: AuthAdminService) {}

	@Post('login')
	@ApiAdminLogin()
	async login(@Body() body: LoginAdminDto) {
		return this.authService.login(body);
	}

	@Get('me')
	@UseGuards(AdminJwtGuard)
	@ApiBearerAuth()
	async getMe(@Req() req: any) {
		const admin = await this.authService.getMe(Number(req.user.id));

		return {
			id: admin.id,
			email: admin.email,
			first_name: admin.firstName,
			last_name: admin.lastName,
			avatar_id: admin.avatarId ?? null,
			role: admin.role,
		};
	}
}
