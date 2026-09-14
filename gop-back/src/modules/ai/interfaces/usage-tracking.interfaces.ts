export interface IFieldUsage {
	field: string;
	model: string;
	inputTokens: number;
	outputTokens: number;
	cost: number;
}

export interface IUsageSummary {
	totalInputTokens: number;
	totalOutputTokens: number;
	totalCost: number;
	fields: IFieldUsage[];
}
