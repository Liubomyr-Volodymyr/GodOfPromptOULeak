import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GotenbergClientService implements OnModuleInit {
	private readonly gotenbergUrl: string;

	constructor() {
		const url: string | undefined = process.env.GOTENBERG_URL;
		const port: string = process.env.GOTENBERG_PORT || '3000';
		this.gotenbergUrl = url?.startsWith('http') ? url : `http://${url || 'localhost'}:${port}`;
	}

	async onModuleInit(): Promise<void> {
		try {
			await axios.get(`${this.gotenbergUrl}/health`);
			console.log('+ Gotenberg service is healthy');
		} catch (error) {
			console.info('GOTENBERG_URL:', this.gotenbergUrl);
			console.error('- Gotenberg service health check failed:', error.message);
			throw new Error('Gotenberg service is not available');
		}
	}

	getGotenbergUrl(): string {
		return this.gotenbergUrl;
	}
}
