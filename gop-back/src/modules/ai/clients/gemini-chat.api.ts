import { GoogleGenAI } from '@google/genai';
import { LLModel } from '../../../common/enums';

export interface ChatResponse {
	content?: string;
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
}

interface GeminiChatApiConfig {
	apiKey: string;
}

interface GeminiChatOptions {
	model?: string;
	maxRetries?: number;
	initialBackoffMs?: number;
}

const RETRYABLE_STATUS_CODES: ReadonlySet<number> = new Set([408, 429, 500, 502, 503, 504]);
const RETRYABLE_KEYWORDS: readonly string[] = [
	'unavailable',
	'resource_exhausted',
	'deadline_exceeded',
	'internal',
	'overloaded',
	'rate limit',
];

export class GeminiChatApi {
	private readonly ai: GoogleGenAI;
	private readonly modelName: string;
	private readonly maxRetries: number;
	private readonly initialBackoffMs: number;

	constructor(
		private readonly config: GeminiChatApiConfig,
		private readonly options: GeminiChatOptions = {},
	) {
		if (!config.apiKey) {
			throw new Error('Google Generative AI API key is required');
		}

		this.ai = new GoogleGenAI({ apiKey: this.config.apiKey });
		this.modelName = this.options.model || LLModel.GEMINI_FLASH_LITE;
		this.maxRetries = this.options.maxRetries ?? 1;
		this.initialBackoffMs = this.options.initialBackoffMs ?? 800;
	}

	async textCompletion(prompt: string): Promise<ChatResponse> {
		if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
			throw new Error('Prompt must be a non-empty string');
		}

		let lastErr: any;

		for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
			try {
				const result = await this.ai.models.generateContent({
					model: this.modelName,
					contents: prompt,
				});

				const usageMetadata = result.usageMetadata;

				return {
					content: result.text,
					usage: usageMetadata
						? {
								promptTokens: usageMetadata.promptTokenCount ?? 0,
								completionTokens: usageMetadata.candidatesTokenCount ?? 0,
								totalTokens: (usageMetadata.promptTokenCount ?? 0) + (usageMetadata.candidatesTokenCount ?? 0),
							}
						: undefined,
				};
			} catch (err: any) {
				lastErr = err;

				if (!this.isRetryable(err) || attempt === this.maxRetries) {
					console.error(`[GeminiChatApi] Failed (model=${this.modelName}, attempt=${attempt + 1}):`, err.message);
					throw new Error(`Gemini model failed to generate content: ${err.message}`);
				}

				const delay: number = this.computeBackoff(attempt);
				console.warn(
					`[GeminiChatApi] Transient error (model=${this.modelName}, attempt=${attempt + 1}/${this.maxRetries + 1}), retrying in ${delay}ms: ${err.message}`,
				);
				await this.sleep(delay);
			}
		}

		throw new Error(`Gemini model failed to generate content: ${lastErr?.message ?? 'unknown error'}`);
	}

	private isRetryable(err: any): boolean {
		const status: number | undefined = err?.status ?? err?.code ?? err?.response?.status;
		if (typeof status === 'number' && RETRYABLE_STATUS_CODES.has(status)) {
			return true;
		}

		const message: string = String(err?.message ?? '').toLowerCase();
		return RETRYABLE_KEYWORDS.some((kw: string): boolean => message.includes(kw));
	}

	private computeBackoff(attempt: number): number {
		const exp: number = this.initialBackoffMs * 2 ** attempt;
		const jitter: number = Math.floor(Math.random() * (this.initialBackoffMs / 2));
		return Math.min(exp + jitter, 15_000);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve): void => {
			setTimeout(resolve, ms);
		});
	}
}
