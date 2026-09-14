import { Module } from '@nestjs/common';
import { GotenbergClientService } from './services/gotenberg-client.service';
import { GotenbergPdfService } from './services/gotenberg-pdf.service';
import { PdfFontService } from './services/gotenberg-pdf-fonts.service';
import { ScreenshotsController } from './controllers/screenshots.controller';
import { ScreenshotService } from './services/gotenberg-screenshots.service';

@Module({
	controllers: [ScreenshotsController],
	providers: [GotenbergClientService, ScreenshotService, GotenbergPdfService, PdfFontService],
	imports: [],
	exports: [ScreenshotService, GotenbergPdfService],
})
export class GotenbergModule {}
