import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { PromptLikes } from '../../../../modules/library/entities/prompt-likes.entity';
import { PromptBookmark } from '../../../../modules/library/entities/prompt-bookmarks.entity';
import { PromptComments } from '../../../../modules/library/entities/prompt-comments.entity';
import { Prompts } from '../../../../modules/library/entities/prompts.entity';
import { User } from '../../../../modules/users/entities/users.entity';
import { SortOrder } from '../../../../common/enums';
import { EngagementFeedItemDto, EngagementFeedPageDto, EngagementType, FindFeedDto } from '../dto/feed.dto';
import { CreateEngagementCommentDto, CreateEngagementDto, UpdateEngagementCommentDto } from '../dto/mutate.dto';

interface IFeedRow {
	id: number | bigint;
	createdAt: Date;
	user: User | null;
	prompt: Prompts | null;
	text?: string;
}

interface IValidatedTarget {
	user: User;
	prompt: Prompts;
}

@Injectable()
export class EngagementService {
	constructor(
		@InjectRepository(PromptLikes)
		private readonly likesRepository: Repository<PromptLikes>,
		@InjectRepository(PromptBookmark)
		private readonly bookmarksRepository: Repository<PromptBookmark>,
		@InjectRepository(PromptComments)
		private readonly commentsRepository: Repository<PromptComments>,
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
		@InjectRepository(Prompts)
		private readonly promptsRepository: Repository<Prompts>,
	) {}

	getLikes(dto: FindFeedDto): Promise<EngagementFeedPageDto> {
		return this.buildFeed(this.likesRepository, EngagementType.Like, dto);
	}

	getBookmarks(dto: FindFeedDto): Promise<EngagementFeedPageDto> {
		return this.buildFeed(this.bookmarksRepository, EngagementType.Bookmark, dto);
	}

	getComments(dto: FindFeedDto): Promise<EngagementFeedPageDto> {
		return this.buildFeed(this.commentsRepository, EngagementType.Comment, dto);
	}

	async createLike(dto: CreateEngagementDto): Promise<EngagementFeedItemDto> {
		const target: IValidatedTarget = await this.validateTarget(dto.userId, dto.promptId);
		await this.ensureNoDuplicate(this.likesRepository, dto.userId, dto.promptId, EngagementType.Like);

		const saved: PromptLikes = await this.likesRepository.save(
			this.likesRepository.create({ prompt: { id: dto.promptId } as Prompts, userId: dto.userId }),
		);

		return this.toFeedItem({ id: saved.id, createdAt: saved.createdAt, user: target.user, prompt: target.prompt }, EngagementType.Like);
	}

	async createBookmark(dto: CreateEngagementDto): Promise<EngagementFeedItemDto> {
		const target: IValidatedTarget = await this.validateTarget(dto.userId, dto.promptId);
		await this.ensureNoDuplicate(this.bookmarksRepository, dto.userId, dto.promptId, EngagementType.Bookmark);

		const saved: PromptBookmark = await this.bookmarksRepository.save(
			this.bookmarksRepository.create({ prompt: { id: dto.promptId } as Prompts, userId: dto.userId }),
		);

		return this.toFeedItem(
			{ id: saved.id, createdAt: saved.createdAt, user: target.user, prompt: target.prompt },
			EngagementType.Bookmark,
		);
	}

	async createComment(dto: CreateEngagementCommentDto): Promise<EngagementFeedItemDto> {
		const target: IValidatedTarget = await this.validateTarget(dto.userId, dto.promptId);

		const saved: PromptComments = await this.commentsRepository.save(
			this.commentsRepository.create({ prompt: { id: dto.promptId } as Prompts, userId: dto.userId, text: dto.text }),
		);

		return this.toFeedItem(
			{ id: saved.id, createdAt: saved.createdAt, user: target.user, prompt: target.prompt, text: saved.text },
			EngagementType.Comment,
		);
	}

	async updateComment(id: number, dto: UpdateEngagementCommentDto): Promise<EngagementFeedItemDto> {
		const comment: PromptComments | null = await this.commentsRepository.findOne({
			where: { id },
			relations: ['user', 'prompt'],
		});
		if (!comment) throw new NotFoundException('Comment not found');

		comment.text = dto.text;
		const saved: PromptComments = await this.commentsRepository.save(comment);

		return this.toFeedItem(
			{ id: saved.id, createdAt: saved.createdAt, user: saved.user, prompt: saved.prompt, text: saved.text },
			EngagementType.Comment,
		);
	}

	async deleteLike(id: number): Promise<{ success: boolean }> {
		return this.deleteById(this.likesRepository, id, EngagementType.Like);
	}

	async deleteBookmark(id: number): Promise<{ success: boolean }> {
		return this.deleteById(this.bookmarksRepository, id, EngagementType.Bookmark);
	}

	async deleteComment(id: number): Promise<{ success: boolean }> {
		return this.deleteById(this.commentsRepository, id, EngagementType.Comment);
	}

	private async validateTarget(userId: string, promptId: string): Promise<IValidatedTarget> {
		const user: User | null = await this.usersRepository.findOne({ where: { id: userId } });
		if (!user) throw new NotFoundException('User not found');

		const prompt: Prompts | null = await this.promptsRepository.findOne({ where: { id: promptId } });
		if (!prompt) throw new NotFoundException('Prompt not found');

		return { user, prompt };
	}

	private async ensureNoDuplicate(
		repository: Repository<PromptLikes> | Repository<PromptBookmark>,
		userId: string,
		promptId: string,
		type: EngagementType,
	): Promise<void> {
		const existing: ObjectLiteral | null = await repository.findOne({ where: { userId, prompt: { id: promptId } } });
		if (existing) throw new ConflictException(`This ${type} already exists`);
	}

	private async deleteById(
		repository: Repository<PromptLikes> | Repository<PromptBookmark> | Repository<PromptComments>,
		id: number,
		type: EngagementType,
	): Promise<{ success: boolean }> {
		const result: { affected?: number | null } = await repository.delete(id);
		if (!result.affected) throw new NotFoundException(`${type} not found`);

		return { success: true };
	}

	private async buildFeed(repository: Repository<ObjectLiteral>, type: EngagementType, dto: FindFeedDto): Promise<EngagementFeedPageDto> {
		const page: number = Number(dto.page) || 1;
		const limit: number = Number(dto.limit) || 20;
		const sortDirection: 'ASC' | 'DESC' = dto.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';

		const queryBuilder = repository
			.createQueryBuilder('row')
			.leftJoinAndSelect('row.user', 'user')
			.leftJoinAndSelect('row.prompt', 'prompt');

		if (dto.promptId) {
			queryBuilder.andWhere('row.prompt_id = :promptId', { promptId: dto.promptId });
		}

		if (dto.search) {
			queryBuilder.andWhere('(prompt.prompt_name ILIKE :search OR user.email ILIKE :search OR user.full_name ILIKE :search)', {
				search: `%${dto.search}%`,
			});
		}

		const [rows, total]: [ObjectLiteral[], number] = await queryBuilder
			.orderBy('row.createdAt', sortDirection)
			.skip((page - 1) * limit)
			.take(limit)
			.getManyAndCount();

		const items: EngagementFeedItemDto[] = rows.map(
			(row: ObjectLiteral): EngagementFeedItemDto => this.toFeedItem(row as IFeedRow, type),
		);

		return {
			items,
			meta: {
				total,
				page,
				limit,
				pageCount: Math.ceil(total / limit),
				hasNextPage: page * limit < total,
			},
		};
	}

	private toFeedItem(row: IFeedRow, type: EngagementType): EngagementFeedItemDto {
		return {
			id: String(row.id),
			type,
			user_id: row.user?.id ?? null,
			user_name: this.resolveUserName(row.user),
			user_email: row.user?.email ?? null,
			prompt_id: row.prompt?.id ?? null,
			prompt_name: row.prompt?.promptName ?? null,
			slug: row.prompt?.slug ?? null,
			text: type === EngagementType.Comment ? (row.text ?? null) : null,
			created_at: row.createdAt,
		};
	}

	private resolveUserName(user: User | null): string | null {
		if (!user) return null;
		if (user.fullName) return user.fullName;
		const composed: string = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
		return composed || null;
	}
}
