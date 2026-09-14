import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminMediaService } from './services/media.service';
import { UploadImageDto } from './dto/upload-image.dto';
import { IUploadedImage } from './interfaces/uploaded-image.interface';
import { ApiUploadImage } from './docs/api-upload-image.decorator';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole, Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Media')
@ApiBearerAuth('access_token')
@Controller()
export class AdminMediaController {
	constructor(private readonly mediaService: AdminMediaService) {}

	@Post('image')
	@Roles(AdminRole.Manager, AdminRole.Admin, AdminRole.SuperAdmin)
	@UseGuards(AdminJwtGuard, RolesGuard)
	@UseInterceptors(
		FileInterceptor('file', {
			limits: {
				fileSize: 5 * 1024 * 1024, // 5MB
			},
		}),
	)
	@ApiUploadImage()
	async uploadImage(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadImageDto): Promise<IUploadedImage> {
		return this.mediaService.uploadImage(file, dto.folder);
	}
}
