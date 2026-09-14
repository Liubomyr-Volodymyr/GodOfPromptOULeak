import { IBlog } from './blog-post-response.interface';

export interface IPostsListMeta {
	total: number;
	limit?: number;
	offset?: number;
}

export interface IPostsListResponse {
	data: IBlog[];
	meta: IPostsListMeta;
}
