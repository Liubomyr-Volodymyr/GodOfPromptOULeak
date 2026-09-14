const FENCE_PATTERN = /^\s*```(?:json)?\s*\n?([\s\S]*?)\n?\s*```\s*$/;

export function stripJsonFence(raw: string): string {
	const match: RegExpMatchArray | null = raw.match(FENCE_PATTERN);
	return match ? match[1].trim() : raw.trim();
}
