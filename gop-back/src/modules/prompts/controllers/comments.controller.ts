import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CommentsService, IPromptCommentView } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Prompt Comments')
@Controller('comments')
export class CommentsController {
	constructor(private readonly commentsService: CommentsService) {}

	@Get('by-prompt/:promptId')
	@ApiOperation({ summary: 'List comments of a prompt' })
	listByPrompt(@Param('promptId', ParseUUIDPipe) promptId: string): Promise<IPromptCommentView[]> {
		return this.commentsService.listByPrompt(promptId);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@ApiOperation({ summary: 'Add a comment to a prompt' })
	create(@Body() dto: CreateCommentDto, @Req() request: Request): Promise<IPromptCommentView> {
		return this.commentsService.create(request.user!.userId, dto);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@ApiOperation({ summary: 'Edit own comment' })
	update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCommentDto, @Req() request: Request): Promise<IPromptCommentView> {
		return this.commentsService.update(id, request.user!.userId, dto);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('access_token')
	@ApiOperation({ summary: 'Delete own comment' })
	remove(@Param('id', ParseIntPipe) id: number, @Req() request: Request): Promise<{ success: boolean }> {
		return this.commentsService.remove(id, request.user!.userId);
	}
}
