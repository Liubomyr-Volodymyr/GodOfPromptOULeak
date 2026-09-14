export interface IRendered {
	rendered: string;
}

export interface IYoastHeadJson {
	title: string | null;
	canonical: string | null;
}

export interface ITaxonomyRef {
	id: number;
	name: string;
	slug: string;
}

export interface IContentRef {
	id: string;
	title: string;
	slug: string;
}

export interface IBlog {
	id: string;
	date: string | null;
	modified: string;
	slug: string;
	status: string;
	link: string;
	title: IRendered;
	excerpt: IRendered;
	content: IRendered;
	yoast_head_json: IYoastHeadJson;
	audience: ITaxonomyRef[];
	tools: ITaxonomyRef[];
	prompts: IContentRef[];
	products: IContentRef[];
}
