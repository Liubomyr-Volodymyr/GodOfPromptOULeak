import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AssistantAttrs, AssistantResponse } from '../dto/assistant.dto';
import { ConfigService } from '@nestjs/config';
import { CONFIG } from '../../../config/enums';

@Injectable()
export class AssistantService {
	private readonly openaiClients: Record<string, OpenAI>;

	constructor(configService: ConfigService) {
		this.openaiClients = {
			custom: new OpenAI({
				apiKey: configService.get<string>(CONFIG.OPENAI_CUSTOM_API_KEY)!,
			}),
			internal: new OpenAI({
				apiKey: configService.get<string>(CONFIG.OPENAI_INTERNAL_API_KEY)!,
			}),
			context: new OpenAI({
				apiKey: configService.get<string>(CONFIG.OPENAI_CONTEXT_API_KEY)!,
			}),
		};
	}

	async getAssistantResponse(dataDto: AssistantAttrs): Promise<AssistantResponse> {
		const openai = this.openaiClients[dataDto.project_key];

		try {
			// Create a new thread for this request
			const thread = await openai.beta.threads.create();

			// Add the message to the thread
			await openai.beta.threads.messages.create(thread.id, {
				role: 'user',
				content: dataDto.prompt,
			});

			// Run the assistant
			const run = await openai.beta.threads.runs.create(thread.id, {
				assistant_id: dataDto.assistantId,
				...(dataDto.responseFormat ? { response_format: { type: dataDto.responseFormat } } : {}),
			});

			// Wait for the completion
			const completedRun = await this.waitForCompletion(thread.id, run.id, openai);

			if (completedRun.status !== 'completed') {
				throw new Error(`Assistant run failed with status: ${completedRun.status}`);
			}

			// Get the messages
			const messages = await openai.beta.threads.messages.list(thread.id);
			const assistantMessage = messages.data.find((message) => message.role === 'assistant');

			if (!assistantMessage || !assistantMessage.content[0]) {
				throw new Error('No response received from assistant');
			}

			const content = this.extractTextContent(assistantMessage.content[0]);

			// Cleanup - delete the thread
			await openai.beta.threads.del(thread.id);

			return { content };
		} catch (error) {
			console.error('Error in assistant service:', error);
			throw new Error(`Failed to get assistant response: ${error.message}`);
		}
	}

	private async waitForCompletion(
		threadId: string,
		runId: string,
		openai: OpenAI,
		maxAttempts = 60,
		delayMs = 1000,
	): Promise<OpenAI.Beta.Threads.Runs.Run> {
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const run = await openai.beta.threads.runs.retrieve(threadId, runId);

			switch (run.status) {
				case 'completed':
					return run;
				case 'failed':
				case 'cancelled':
				case 'expired':
					throw new Error(`Run ended with status: ${run.status}`);
				default:
					await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}

		throw new Error('Assistant run timed out');
	}

	private extractTextContent(content: OpenAI.Beta.Threads.Messages.MessageContent): string {
		if (content.type === 'text') {
			return content.text.value;
		}
		throw new Error(`Unsupported content type: ${content.type}`);
	}
}
