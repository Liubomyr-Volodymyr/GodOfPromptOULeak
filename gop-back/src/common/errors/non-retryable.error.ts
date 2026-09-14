export class NonRetryableError extends Error {
	readonly isNonRetryable = true;

	constructor(message: string) {
		super(message);
		this.name = 'NonRetryableError';
	}
}

export const isNonRetryableError = (err: unknown): err is NonRetryableError =>
	!!err && typeof err === 'object' && (err as NonRetryableError).isNonRetryable === true;
