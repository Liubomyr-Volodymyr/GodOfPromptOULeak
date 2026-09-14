import { Request, Response } from 'express';
import { Controller, Get, Body, Patch, Param, Req, UseGuards, Post, UseInterceptors, UploadedFile, Res, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { DeleteAccountDto, UpdateUserDto } from '../dto';
import { JwtAuthGuard } from '../../auth/guards';
import { ApiDeleteAccount, ApiFindContactByEmail, ApiGetAvatar, ApiUpdateUserProfile, ApiUploadAvatar } from '../docs';

@ApiTags('Users')
@ApiBearerAuth('access_token')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Patch('profile')
	@UseGuards(JwtAuthGuard)
	@ApiUpdateUserProfile()
	async updateContactProfile(@Body() updateDto: UpdateUserDto, @Req() req: Request) {
		const userId = req.user.userId;
		return await this.usersService.updateContact(userId, updateDto);
	}

	@Get('avatar')
	@UseGuards(JwtAuthGuard)
	@ApiGetAvatar()
	async getAvatar(@Req() req: any, @Res() res: Response): Promise<void> {
		const url = await this.usersService.getAvatarUrl(req.user.userId);

		if (!url) {
			res.status(204).end();
			return;
		}

		res.redirect(url);
	}

	@Get(':email')
	@UseGuards(JwtAuthGuard)
	@ApiFindContactByEmail()
	findOne(@Param('email') email: string) {
		return this.usersService.findUserByEmail(email);
	}

	@Post('avatar')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
			},
		}),
	)
	@ApiUploadAvatar()
	async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
		const userId = req.user.userId;
		const avatarId = await this.usersService.uploadAvatar(userId, file);
		return { avatarId };
	}

	@Delete('delete-account')
	@UseGuards(JwtAuthGuard)
	@ApiDeleteAccount()
	async deleteAccount(@Body() dto: DeleteAccountDto, @Req() req: Request): Promise<void> {
		await this.usersService.deleteAccount(req.user.userId, dto.password);
	}
}
