export interface IModelPricing {
	input: number;
	output: number;
}

export interface IOpenRouterModel {
	id: string;
	pricing?: {
		prompt?: string;
		completion?: string;
	};
}

export interface IOpenRouterResponse {
	data: IOpenRouterModel[];
}
