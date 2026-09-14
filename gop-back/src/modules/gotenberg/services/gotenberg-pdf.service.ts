import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { promises as fs } from 'fs';
import { AIResult } from '../../generator/dto/generator.dto';
import dayjs from 'dayjs';
import { PdfFontService } from './gotenberg-pdf-fonts.service';
import axios from 'axios';
import FormData from 'form-data';
import { GotenbergClientService } from './gotenberg-client.service';

@Injectable()
export class GotenbergPdfService {
	private readonly gotenbergUrl: string;

	constructor(
		private readonly gotenbergClientService: GotenbergClientService,
		private readonly pdfFontService: PdfFontService,
	) {
		this.gotenbergUrl = this.gotenbergClientService.getGotenbergUrl();
	}

	async createPDF(data: AIResult): Promise<Buffer> {
		const html = await this.generateHtml(data);
		const formData = new FormData();

		formData.append('files', Buffer.from(html), {
			filename: 'index.html',
			contentType: 'text/html',
		});

		const response = await axios.post(`${this.gotenbergUrl}/forms/chromium/convert/html`, formData, {
			responseType: 'arraybuffer',
			headers: formData.getHeaders(),
		});

		return Buffer.from(response.data);
	}

	private async generateHtml(data: AIResult): Promise<string> {
		try {
			const logo = await this.getImage('logo.png');
			const lightning = await this.getImage('lightning.png');
			const bulb1 = await this.getImage('bulb-1.png');
			const bulb2 = await this.getImage('bulb-2.png');
			const question1 = await this.getImage('question-1.png');
			const question2 = await this.getImage('question-2.png');
			const gear = await this.getImage('gear.png');
			const stars = await this.getImage('stars.png');
			const magnify = await this.getImage('magnify.png');
			// const input = await this.getImage('input.png');
			const year = dayjs().format('YYYY');

			const fontFaces = await this.pdfFontService.generateFontFaces();

			return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
    <style>
    	${fontFaces}

		@page {
			margin: 70px 80px;
			size: A4;
			background-color: #fff;
		}
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			color: #171717;
			font-family: 'Montserrat', sans-serif;
			font-size: 16px;
			line-height: 1.5;
			font-weight: 500;
			text-align: left;
		}
		.text-row {
			margin-bottom: 15px;
			display: inline-flex;
			align-items: center;
		}
		
		.site {
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			justify-content: space-between;
		}
		.main {
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
		}
		
		.header {
			width: 100%;
			margin-bottom: 30px;
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
		.main-title {
			font-size: 42px;
			font-weight: 700;
			text-align: center;
		}
		.description {
			font-size: 20px;
			font-weight: 400;
			text-align: center;
		}
		
		.prompt-title {
			margin-bottom: 20px;
			font-size: 28px;
			font-weight: 700;
		}
		
		.yellow-box {
			width: 100%;
			margin-bottom: 25px;
			padding: 20px 15px;
			border-radius: 15px;
			background-color: #FCC20180;
			display: flex;
			align-items: flex-start;
		}
		.icon {
			margin-right: 10px;
		}
		
		.code {
			width: 100%;
			margin-bottom: 25px;
			padding: 32px;
			border-radius: 15px;
			background-color: #2D2B2C;
			color: #fff;
			font-family: monospace, sans-serif;
		}
		
		.text {
			margin-bottom: 25px;
		}
		
		.buttons {
			width: 100%;
			margin-top: 30px;
			margin-bottom: 40px;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 12px;
		}
		.btn {
			padding: 10px 20px;
			border-radius: 100px;
			background-color: #171717;
			color: #fff;
			text-decoration: none;
			display: inline-flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
		}
		.btn-yellow {
			background: linear-gradient(to bottom, #ECDF5F 0%, #FDC302 100%);
			color: #171717;
		}
		
		.footer {
			width: 100%;
			padding: 20px 30px;
			background-color: #fff;
			color: #171717;
			text-align: center;
		}
		.link {
			color: inherit;
		}
    </style>
</head>
<body>
    <div class="site">
        <div class="main">
            <div class="header">
                <img src="${logo}" class="logo" width="70" alt="" />
                <div class="header-content">
                    <h1 class="main-title">God of Prompt</h1>
                    <span class="description">Your AI Superpowers In One Click</span>
                </div>
                <img src="${lightning}" class="lightning" width="60" alt="" />
            </div>

            <h2 class="prompt-title">${this.nl2br(data['prompt-name'])}</h2>

            <div class="yellow-box">
                <img src="${bulb1}" class="icon" width="30" alt="" />
                <p>${this.nl2br(data.description)}</p>
            </div>

            <h2 class="text-row">
                <img src="${gear}" class="icon" width="30" alt="" />
                Prompt
            </h2>
            <p class="code">${this.nl2br(data['prompt-body'])}</p>

            <h2 class="text-row">
                <img src="${bulb2}" class="icon" width="30" alt="" />
                Tips
            </h2>
            <p class="text">${this.nl2br(data['tips'])}</p>

            <h2 class="text-row">
                <img src="${question1}" class="icon" width="30" alt="" />
                How to Use The Prompt
            </h2>
            <p class="text">${this.nl2br(data['how-to-use'])}</p>

            <div class="buttons">
                <a href="${process.env.URL_PROMPT_LIBRARY}" class="btn" target="_blank">
                    <img src="${magnify}" class="icon" width="15" alt="" />
                    Prompt Library
                </a>
                <a href="${process.env.URL_GENERATE_FORM}" class="btn btn-yellow" target="_blank">
                    <img src="${stars}" class="icon" width="15" alt="" />
                    Generate Next Prompt
                </a>
                <a href="${process.env.URL_CONTACTS}" class="btn" target="_blank">
                    <img src="${question2}" class="icon" width="15" alt="" />
                    Get Help
                </a>
            </div>
        </div>
        <div class="footer">
            <p class="copyright">
            	Copyright © ${year}
            	<a href="${process.env.URL_SITE_MAIN}" class="link" target="_blank">God of Prompt</a>
            	All Rights Reserved.
            </p>
        </div>
    </div>
</body>
</html>
        	`;
		} catch (error) {
			console.error('Failed to generate HTML:', error);
			throw new Error('Failed to generate HTML');
		}
	}

	private async getImage(filename: string): Promise<string> {
		try {
			const imagePath = path.join(process.cwd(), 'dist/modules/gotenberg/assets/images', filename);
			const imageBuffer = await fs.readFile(imagePath);
			const extension = path.extname(filename).slice(1);
			return `data:image/${extension};base64,${imageBuffer.toString('base64')}`;
		} catch (error) {
			console.error(`Failed to load image ${filename}:`, error);
			throw new Error(`Failed to load image ${filename}`);
		}
	}

	private nl2br(str: string | null | undefined): string {
		if (!str) return '';
		return str.replace(/\r\n|\r|\n/g, '<br>');
	}
}
