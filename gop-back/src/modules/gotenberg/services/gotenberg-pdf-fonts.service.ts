import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { promises as fs } from 'fs';

@Injectable()
export class PdfFontService {
	private async getFont(filename: string): Promise<string> {
		try {
			const fontPath = path.join(process.cwd(), 'dist/modules/gotenberg/assets/fonts', filename);
			const fontBuffer = await fs.readFile(fontPath);
			return fontBuffer.toString('base64');
		} catch (error) {
			console.error(`Failed to load font ${filename}:`, error);
			throw new Error(`Failed to load font ${filename}`);
		}
	}

	async generateFontFaces(): Promise<string> {
		try {
			const montserratRegular = await this.getFont('Montserrat-Regular.ttf');
			const montserratMedium = await this.getFont('Montserrat-Medium.ttf');
			const montserratBold = await this.getFont('Montserrat-Bold.ttf');

			return `
				@font-face {
                    font-family: 'Montserrat';
                    src: url(data:font/truetype;charset=utf-8;base64,${montserratRegular}) format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Montserrat';
                    src: url(data:font/truetype;charset=utf-8;base64,${montserratMedium}) format('truetype');
                    font-weight: 500;
                    font-style: normal;
                }
                @font-face {
                    font-family: 'Montserrat';
                    src: url(data:font/truetype;charset=utf-8;base64,${montserratBold}) format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
            `;
		} catch (error) {
			console.error('Failed to generate font faces:', error);
			throw new Error('Failed to generate font faces');
		}
	}
}
