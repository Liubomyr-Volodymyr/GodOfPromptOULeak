export class ProductStatsChartProductDto {
	productId: string;
	productName: string;
	count: number;
}

export class ProductStatsChartSeriesDto {
	productId: string;

	productName: string;
}

export class ProductStatsChartItemDto {
	bucket: string; // "2026-W01" | "2026-01" | "2026-01-01"
	products: ProductStatsChartProductDto[];
	total: number;
}

export class ProductStatsChartResponseDto {
	granularity: 'day' | 'week' | 'month';
	data: ProductStatsChartItemDto[];
	series: ProductStatsChartSeriesDto[];
}
