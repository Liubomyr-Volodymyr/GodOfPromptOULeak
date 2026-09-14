export type ImportAction = 'created' | 'updated' | 'failed';

export interface IImportRowResult {
	slug: string;
	action: ImportAction;
	id?: string;
	warnings?: string[];
	error?: string;
}

export interface IImportSummary {
	total: number;
	created: number;
	updated: number;
	failed: number;
	results: IImportRowResult[];
}

export interface IPostsStats {
	total: number;
	published: number;
	draft: number;
	archived: number;
}

export interface IDevPostMeta {
	seoTitle: string | null;
	seoDescription: string | null;
	canonicalUrl: string | null;
	coverImageUrl: string | null;
	ogImageUrl: string | null;
	schemaType: string;
	seoStatus: string;
	readingTimeMinutes: number | null;
}

export interface IDevPostListItem {
	id: string;
	slug: string;
	title: string;
	status: string;
	publishedAt: Date | null;
	modifiedAt: Date | null;
	updatedAt: Date;
	meta: IDevPostMeta;
}

export interface IDevPostsPage {
	total: number;
	limit: number;
	offset: number;
	data: IDevPostListItem[];
}
