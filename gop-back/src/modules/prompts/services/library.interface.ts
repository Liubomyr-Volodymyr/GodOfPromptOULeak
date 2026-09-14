import { PromptsQueryDto } from '../dto/prompts-query.dto';
import { ItemsQueryDto } from '../dto/items-query.dto';
import { ProductsQueryDto } from '../dto/products-query.dto';
import { Prompts } from '../../library/entities/prompts.entity';
import { Tool } from '../../library/entities/tools.entity';
import { IPromptCommentView } from './comments.service';
import { Categories } from '../../library/entities/categories.entity';
import { Products } from '../../user-products/entities/products.entity';

export interface IPromptsListMeta {
	total: number;
	limit?: number;
	offset?: number;
}

export type PromptListItem = Omit<Prompts, 'outputType' | 'outputTypeId'> & {
	output_type: string | null;
};

export interface IPromptsListResponse {
	data: PromptListItem[];
	meta: IPromptsListMeta;
}

export type PromptDetailResponse = Omit<Prompts, 'toolRelations' | 'outputType' | 'outputTypeId' | 'comments'> & {
	tools: Tool[];
	comments: IPromptCommentView[];
	exampleOutputEmbed: string;
	output_type: string | null;
};

export interface ICategoriesListResponse {
	data: Categories[];
}

export interface IProductsListResponse {
	data: Products[];
}

export interface ILibraryService {
	findAll(dto: PromptsQueryDto): Promise<IPromptsListResponse>;
	findById(id: string, userId: string | null): Promise<PromptDetailResponse>;
	getTools(dto: ItemsQueryDto): Promise<{ data: Tool[] }>;
	getCategories(dto: ItemsQueryDto): Promise<ICategoriesListResponse>;
	getProducts(dto: ProductsQueryDto): Promise<IProductsListResponse>;
}
