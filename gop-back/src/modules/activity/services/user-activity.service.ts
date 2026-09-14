import { Injectable } from '@nestjs/common';

@Injectable()
export class UserActivityService {
	constructor() {}

	async track(data: any) {
		try {
			// TODO save to db
		} catch (error) {
			console.error('Error tracking user activity:', error);
		}
	}
}
