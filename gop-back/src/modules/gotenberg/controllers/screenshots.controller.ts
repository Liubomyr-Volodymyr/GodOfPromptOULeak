import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiKeyGuard } from '../../../common/guards/api-key.guard';
import { ScreenshotService } from '../services/gotenberg-screenshots.service';

@SkipThrottle()
@Controller('screenshots')
export class ScreenshotsController {
	constructor(private screenshotService: ScreenshotService) {}

	@Post('generate')
	@UseGuards(ApiKeyGuard)
	async createScreenshot(@Body() data: { content: string }) {
		const buffer = await this.screenshotService.createScreenshot(data.content);
		return buffer.toString('base64');
	}
}
