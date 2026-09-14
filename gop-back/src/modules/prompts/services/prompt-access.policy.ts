import { Injectable } from '@nestjs/common';
import { Prompts } from '../../library/entities/prompts.entity';

export type PromptAccessResult = {
	hasAccess: boolean;
	reason?: 'NOT_ALLOWED' | 'PRIVATE_PROMPT';
};

@Injectable()
export class PromptAccessPolicy {
	async check(prompt: Prompts): Promise<PromptAccessResult> {
		try {
			if (prompt.userId) {
				return { hasAccess: false, reason: 'PRIVATE_PROMPT' };
			}

			if (prompt.status !== 'published') {
				return { hasAccess: false, reason: 'NOT_ALLOWED' };
			}

			return { hasAccess: true };
		} catch (err) {
			throw err;
		}
	}
}
