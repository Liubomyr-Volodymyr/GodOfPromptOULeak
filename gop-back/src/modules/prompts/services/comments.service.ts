import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromptComments } from '../../library/entities/prompt-comments.entity';
import { Prompts } from '../../library/entities/prompts.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';

export interface IPromptCommentView {
	id: number;
	text: string;
	commentator_id: string | null;
}

@Injectable()
export class CommentsService {
	constructor(
		@InjectRepository(PromptComments)
		private readonly commentsRepository: Repository<PromptComments>,
		@InjectRepository(Prompts)
		private readonly promptsRepository: Repository<Prompts>,
	) {}

	async create(userId: string, dto: CreateCommentDto): Promise<IPromptCommentView> {
		const prompt: Prompts | null = await this.promptsRepository.findOne({ where: { id: dto.promptId } });
		if (!prompt) throw new NotFoundException('Prompt not found');

		const comment: PromptComments = this.commentsRepository.create({
			prompt: { id: dto.promptId } as Prompts,
			userId,
			text: dto.text,
		});
		const saved: PromptComments = await this.commentsRepository.save(comment);

		return this.toView(saved);
	}

	async listByPrompt(promptId: string): Promise<IPromptCommentView[]> {
		const comments: PromptComments[] = await this.commentsRepository.find({
			where: { prompt: { id: promptId } },
			order: { createdAt: 'DESC' },
		});

		return comments.map((comment: PromptComments): IPromptCommentView => this.toView(comment));
	}

	async update(id: number, userId: string, dto: UpdateCommentDto): Promise<IPromptCommentView> {
		const comment: PromptComments = await this.findOwned(id, userId);
		comment.text = dto.text;
		const saved: PromptComments = await this.commentsRepository.save(comment);

		return this.toView(saved);
	}

	async remove(id: number, userId: string): Promise<{ success: boolean }> {
		const comment: PromptComments = await this.findOwned(id, userId);
		await this.commentsRepository.remove(comment);

		return { success: true };
	}

	private async findOwned(id: number, userId: string): Promise<PromptComments> {
		const comment: PromptComments | null = await this.commentsRepository.findOne({ where: { id } });
		if (!comment) throw new NotFoundException('Comment not found');
		if (comment.userId !== userId) throw new ForbiddenException('Not your comment');

		return comment;
	}

	private toView(comment: PromptComments): IPromptCommentView {
		return {
			id: comment.id,
			text: comment.text,
			commentator_id: comment.userId,
		};
	}
}
