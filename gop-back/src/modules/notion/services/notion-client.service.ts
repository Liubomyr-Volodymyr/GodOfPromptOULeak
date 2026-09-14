import { Injectable } from '@nestjs/common';
import { Client } from '@notionhq/client';

@Injectable()
export class NotionClientService {
	private readonly notion: Client;

	constructor() {
		this.notion = new Client({ auth: process.env.NOTION_API_KEY });
	}

	getClient(): Client {
		return this.notion;
	}
}
