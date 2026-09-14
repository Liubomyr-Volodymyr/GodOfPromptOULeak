import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatusEnum } from '../entities/post.entity';

export class DevPostsQueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(500)
	limit?: number = 100;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(0)
	offset?: number = 0;

	@IsOptional()
	@IsEnum(PostStatusEnum)
	status?: PostStatusEnum;
}
