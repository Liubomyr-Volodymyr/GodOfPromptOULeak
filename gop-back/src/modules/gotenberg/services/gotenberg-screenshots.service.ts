import { Injectable } from '@nestjs/common';
import axios from 'axios';
import sharp from 'sharp';
import FormData from 'form-data';
import { promises as fs } from 'fs';
import * as path from 'path';
import { GotenbergClientService } from './gotenberg-client.service';
import { ScreenshotOptions } from '../dto/gotenberg-screenshot.dto';

@Injectable()
export class ScreenshotService {
	private readonly gotenbergUrl: string;
	private readonly defaultOptions: ScreenshotOptions = {
		width: 800,
		scale: 1,
		quality: 80,
	};
	private template: string;
	private styles: string;

	constructor(private readonly gotenbergClientService: GotenbergClientService) {
		this.gotenbergUrl = this.gotenbergClientService.getGotenbergUrl();

		this.initializeTemplates().catch((error) => {
			console.error('Failed to initialize templates:', error);
			throw error;
		});
	}

	async createScreenshot(content: string): Promise<Buffer> {
		const html = this.generateHtml(content);
		const formData = new FormData();

		formData.append('files', Buffer.from(html), {
			filename: 'index.html',
			contentType: 'text/html',
		});

		const response = await axios.post(`${this.gotenbergUrl}/forms/chromium/screenshot/html`, formData, {
			params: {
				width: this.defaultOptions.width,
				scale: this.defaultOptions.scale,
				waitForExpression: 'document.readyState === "complete"',
				preferCssPageSize: true,
			},
			responseType: 'arraybuffer',
			headers: formData.getHeaders(),
		});

		return await sharp(Buffer.from(response.data))
			.jpeg({
				quality: this.defaultOptions.quality,
				mozjpeg: true,
				chromaSubsampling: '4:4:4',
				trellisQuantisation: true,
				overshootDeringing: true,
				optimiseCoding: true,
			})
			.toBuffer();
	}

	private async initializeTemplates(): Promise<void> {
		const [templateContent, stylesContent] = await Promise.all([
			this.loadTemplate('screenshot.html'),
			this.loadTemplate('screenshot.css'),
		]);

		this.template = templateContent;
		this.styles = stylesContent;
	}

	private async loadTemplate(filename: string): Promise<string> {
		try {
			const templatePath = path.join(process.cwd(), 'dist', 'modules', 'gotenberg', 'assets', 'templates', filename);
			return await fs.readFile(templatePath, 'utf-8');
		} catch (error) {
			console.error(`Failed to load template ${filename}:`, error);
			throw new Error(`Failed to load template ${filename}`);
		}
	}

	private generateHtml(content: string): string {
		return this.template.replace('{{content}}', content).replace('{{styles}}', this.styles);
	}
}
