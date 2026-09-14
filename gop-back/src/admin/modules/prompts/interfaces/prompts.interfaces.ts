export interface IModeratorStats {
	moderator_id: string;
	first_name: string;
	last_name: string;
	total_prompts: number;
	published_prompts: number;
	total_likes: number;
	total_views: number;
	total_costs: number;
	last_created_at: string | null;
	last_published_at: string | null;
}

export interface IModeratorAccumulator {
	total: number;
	published: number;
	likes: number;
	views: number;
	costs: number;
	lastCreatedAt: string | null;
	lastPublishedAt: string | null;
}

export interface IUser {
	id: string;
	first_name?: string;
	last_name?: string;
	email?: string;
}

export interface IPromptListItem {
	id: string;
	page_name: string;
	prompt_name: string;
	author_name: string;
	author_type: 'moderator' | 'user';
	price: number;
	is_estimated: boolean;
	status: string;
	views_count: number;
	likes_count: number;
	bookmarks_count: number;
	comments_count: number;
	prompt_format: string;
	category_name: string | null;
	sub_category_name: string | null;
	is_premium: boolean | null;
	date_created: string | null;
	date_published: string | null;
}
