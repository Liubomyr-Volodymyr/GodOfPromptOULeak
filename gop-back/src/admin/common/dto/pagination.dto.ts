export class PaginationMeta {
	total: number;
	page: number;
	limit: number;
	pageCount: number;
	hasNextPage: boolean;
}

export class PaginationItems<T> {
	items: T[];
	meta: PaginationMeta;
}
