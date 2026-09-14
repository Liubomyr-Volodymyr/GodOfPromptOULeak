import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EngagementService } from './services/engagement.service';
import { EngagementFeedItemDto, EngagementFeedPageDto, FindFeedDto } from './dto/feed.dto';
import { CreateEngagementCommentDto, CreateEngagementDto, UpdateEngagementCommentDto } from './dto/mutate.dto';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminRole, Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admin Engagement')
@ApiBearerAuth('access_token')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.Admin, AdminRole.SuperAdmin, AdminRole.Manager)
@Controller()
export class EngagementController {
	constructor(private readonly engagementService: EngagementService) {}

	@Get('likes')
	@ApiOperation({ summary: 'List all prompt likes across all prompts' })
	@ApiOkResponse({ type: EngagementFeedPageDto })
	getLikes(@Query() dto: FindFeedDto): Promise<EngagementFeedPageDto> {
		return this.engagementService.getLikes(dto);
	}

	@Post('likes')
	@ApiOperation({ summary: 'Add a like on behalf of a user' })
	@ApiOkResponse({ type: EngagementFeedItemDto })
	createLike(@Body() dto: CreateEngagementDto): Promise<EngagementFeedItemDto> {
		return this.engagementService.createLike(dto);
	}

	@Delete('likes/:id')
	@ApiOperation({ summary: 'Delete a like' })
	deleteLike(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.engagementService.deleteLike(id);
	}

	@Get('bookmarks')
	@ApiOperation({ summary: 'List all prompt bookmarks across all prompts' })
	@ApiOkResponse({ type: EngagementFeedPageDto })
	getBookmarks(@Query() dto: FindFeedDto): Promise<EngagementFeedPageDto> {
		return this.engagementService.getBookmarks(dto);
	}

	@Post('bookmarks')
	@ApiOperation({ summary: 'Add a bookmark on behalf of a user' })
	@ApiOkResponse({ type: EngagementFeedItemDto })
	createBookmark(@Body() dto: CreateEngagementDto): Promise<EngagementFeedItemDto> {
		return this.engagementService.createBookmark(dto);
	}

	@Delete('bookmarks/:id')
	@ApiOperation({ summary: 'Delete a bookmark' })
	deleteBookmark(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.engagementService.deleteBookmark(id);
	}

	@Get('comments')
	@ApiOperation({ summary: 'List all prompt comments across all prompts' })
	@ApiOkResponse({ type: EngagementFeedPageDto })
	getComments(@Query() dto: FindFeedDto): Promise<EngagementFeedPageDto> {
		return this.engagementService.getComments(dto);
	}

	@Post('comments')
	@ApiOperation({ summary: 'Add a comment on behalf of a user' })
	@ApiOkResponse({ type: EngagementFeedItemDto })
	createComment(@Body() dto: CreateEngagementCommentDto): Promise<EngagementFeedItemDto> {
		return this.engagementService.createComment(dto);
	}

	@Patch('comments/:id')
	@ApiOperation({ summary: 'Edit a comment' })
	@ApiOkResponse({ type: EngagementFeedItemDto })
	updateComment(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEngagementCommentDto): Promise<EngagementFeedItemDto> {
		return this.engagementService.updateComment(id, dto);
	}

	@Delete('comments/:id')
	@ApiOperation({ summary: 'Delete a comment' })
	deleteComment(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
		return this.engagementService.deleteComment(id);
	}
}
