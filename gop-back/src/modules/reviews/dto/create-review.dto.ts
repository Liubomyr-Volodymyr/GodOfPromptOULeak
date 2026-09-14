import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsObject, IsString, Max, Min, ValidateNested } from 'class-validator';

export class ReviewContentDto {
	@IsString()
	@IsNotEmpty()
	title: string;

	@IsString()
	@IsNotEmpty()
	description: string;
}

export class ReviewUserDto {
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsNotEmpty()
	avatar_url: string;
}

export class CreateReviewDto {
	@IsObject()
	@ValidateNested()
	@Type(() => ReviewContentDto)
	review: ReviewContentDto;

	@IsObject()
	@ValidateNested()
	@Type(() => ReviewUserDto)
	user: ReviewUserDto;

	@IsInt()
	@Min(1)
	@Max(5)
	stars_amount: number;
}
