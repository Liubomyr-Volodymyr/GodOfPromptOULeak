export interface DailyUserSummary {
	id: string;
	summary: string;
	count: number;
	created_at: string;
}

export interface UpsertSummaryPointParams {
	id: string;
	vector: number[];
	summary: string;
	user_id: string;
	count: number;
}
