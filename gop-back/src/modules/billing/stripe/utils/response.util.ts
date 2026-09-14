export interface ApiResponse<T = any> {
	success: boolean;
	error?: string;
	data?: T;
	[key: string]: any;
}

export function createSuccessResponse<T>(data: T, additionalFields?: Record<string, any>): ApiResponse<T> {
	return {
		success: true,
		...data,
		...(additionalFields || {}),
	};
}

export function createErrorResponse(error: string, additionalFields?: Record<string, any>): ApiResponse {
	return {
		success: false,
		error,
		...(additionalFields || {}),
	};
}
