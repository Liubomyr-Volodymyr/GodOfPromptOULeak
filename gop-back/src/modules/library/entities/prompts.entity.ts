import { Entity, Column, PrimaryGeneratedColumn, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { PromptsTools } from './prompts-tools.entity';
import { PromptsAudienceTypes } from './prompts-audience-types.entity';
import { PromptFormat } from './prompt-format.entity';
import { InputFormat } from './input-format.entity';
import { Categories } from './categories.entity';
import { Author } from './authors.entity';
import { Source } from './sources.entity';
import { OutputTypeId, OutputTypes } from '../../user-products/entities/output-types.entity';
import { PromptComments } from './prompt-comments.entity';

export enum PromptStatusEnum {
	PUBLISHED = 'published',
	PENDING = 'pending',
}

@Entity('prompts')
@Index(['userId'])
@Index('uq_prompts_slug', ['slug'], { unique: true })
@Index('idx_prompts_feed', ['status', 'dateCreated'])
@Index(['categoryId', 'subCategoryId'])
export class Prompts {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({
		type: 'uuid',
		name: 'user_id',
		nullable: true,
	})
	userId: string | null;

	@Column({
		type: 'int',
		name: 'output_type_id',
		nullable: false,
	})
	outputTypeId: OutputTypeId;

	@Column({
		type: 'uuid',
		name: 'user_folder_id',
		nullable: true,
	})
	userFolderId: string | null;

	@Column({
		type: 'timestamp',
		name: 'date_created',
		nullable: false,
	})
	dateCreated: Date;

	@Column({
		type: 'timestamp',
		name: 'date_updated',
		nullable: true,
	})
	dateUpdated: Date | null;

	@Column({
		type: 'enum',
		nullable: false,
		enum: PromptStatusEnum,
	})
	status: PromptStatusEnum;

	@Column({
		type: 'varchar',
		name: 'example_output_embed',
		nullable: true,
	})
	exampleOutputEmbed: string | null; // html

	@Column({
		type: 'varchar',
		name: 'example_output_url',
		nullable: true,
	})
	exampleOutputUrl: string | null;

	@Column({
		type: 'varchar',
		nullable: true,
	})
	icon: string | null;

	@Column({
		type: 'text',
		name: 'what_this_prompt_does',
		nullable: true,
	})
	whatThisPromptDoes: string | null;

	@Column({
		type: 'text',
		nullable: true,
	})
	tips: string | null;

	@Column({
		type: 'text',
		nullable: true,
	})
	description: string | null;

	@Column({
		type: 'varchar',
		nullable: false,
	})
	slug: string;

	@Column({
		type: 'varchar',
		name: 'page_name',
		nullable: false,
	})
	pageName: string;

	@Column({
		type: 'varchar',
		name: 'prompt_name',
		nullable: false,
	})
	promptName: string;

	@Column({
		type: 'text',
		name: 'how_to_use_the_prompt',
		nullable: true,
	})
	howToUseThePrompt: string | null;

	@Column({
		type: 'text',
		name: 'seo_description',
		nullable: true,
	})
	seoDescription: string | null;

	@Column({
		type: 'boolean',
		name: 'is_premium',
		nullable: false,
		default: false,
	})
	isPremium: boolean;

	@Column({
		type: 'text',
		name: 'input_body',
		nullable: true,
	})
	inputBody: string | null;

	@Column({
		type: 'timestamp',
		name: 'date_published',
		nullable: true,
	})
	datePublished: Date | null;

	@Column({
		type: 'int',
		name: 'input_format',
		nullable: true,
	})
	inputFormatId: number | null;

	@Column({
		type: 'int',
		name: 'prompt_format',
		nullable: true,
	})
	promptFormatId: number | null;

	@Column({
		type: 'uuid',
		name: 'moderator_id',
		nullable: true,
	})
	moderatorId: string | null;

	@Column({
		type: 'int',
		name: 'likes_count',
		default: 0,
		nullable: false,
	})
	likesCount: number;

	@Column({
		type: 'int',
		name: 'views_count',
		default: 0,
		nullable: false,
	})
	viewsCount: number;

	@Column({
		type: 'int',
		name: 'unique_views_count',
		nullable: true,
	})
	uniqueViewsCount: number | null;

	@Column({
		type: 'int',
		name: 'bookmarks_count',
		nullable: true,
	})
	bookmarksCount: number | null;

	@Column({
		type: 'text',
		name: 'prompt_body',
		nullable: false,
	})
	promptBody: string;

	@Column({
		type: 'int',
		name: 'category_id',
		nullable: true,
	})
	categoryId: number | null;

	@Column({
		type: 'int',
		name: 'sub_category_id',
		nullable: true,
	})
	subCategoryId: number | null;

	@Column({
		type: 'decimal',
		name: 'generation_cost',
		precision: 10,
		scale: 4,
		nullable: true,
	})
	generationCost: string | null;

	@Column({
		type: 'int',
		name: 'generation_input_tokens',
		nullable: true,
	})
	generationInputTokens: number | null;

	@Column({
		type: 'int',
		name: 'generation_output_tokens',
		nullable: true,
	})
	generationOutputTokens: number | null;

	@Column({
		type: 'int',
		name: 'author_id',
		nullable: true,
	})
	authorId: number | null;

	@Column({
		type: 'int',
		name: 'source_id',
		nullable: true,
	})
	sourceId: number | null;

	@ManyToOne(() => OutputTypes, {
		nullable: false,
		onDelete: 'RESTRICT',
	})
	@JoinColumn({ name: 'output_type_id' })
	outputType: OutputTypes;

	@ManyToOne(() => Author, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'author_id' })
	author: Author | null;

	@ManyToOne(() => Source, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'source_id' })
	source: Source | null;

	@ManyToOne(() => Categories, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'category_id' })
	category: Categories | null;

	@ManyToOne(() => Categories, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'sub_category_id' })
	subCategory: Categories | null;

	@OneToMany(() => PromptsTools, (pt) => pt.prompt)
	toolRelations: PromptsTools[];

	@OneToMany(() => PromptsAudienceTypes, (pat) => pat.prompt)
	audienceTypeRelations: PromptsAudienceTypes[];

	@Index('idx_prompts_prompt_format')
	@ManyToOne(() => PromptFormat, (pf) => pf.prompts, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'prompt_format' })
	promptFormat: PromptFormat | null;

	@Index('idx_prompts_input_format')
	@ManyToOne(() => InputFormat, (inf) => inf.prompts, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'input_format' })
	inputFormat: InputFormat | null;

	@OneToMany(() => PromptComments, (comment: PromptComments) => comment.prompt)
	comments: PromptComments[];
}
