import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CategoriesQueryDto } from '../../../../modules/prompts/dto/categories-query.dto';
import { CreateCategoryDto } from '../../../../modules/prompts/dto/create-category.dto';
import { CreateOutputTypeDto } from '../../../../modules/prompts/dto/create-output-type.dto';
import { CatalogService, ICategoryItem, IInputFormatItem } from '../../../../modules/prompts/services/catalog.service';

import { User } from '../../../../modules/users/entities/users.entity';
import { OutputTypes } from '../../../../modules/user-products/entities/output-types.entity';

export { ICategoryItem, IInputFormatItem };

@Injectable()
export class PromptsCatalogService {
	constructor(
		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
		private readonly catalogService: CatalogService,
	) {}

	async resolveUserId(email: string): Promise<string> {
		try {
			const user: Pick<User, 'id'> | null = await this.userRepo.findOne({
				where: { email },
				select: ['id'],
			});

			if (!user) {
				throw new HttpException(`User not found for email: ${email}`, HttpStatus.NOT_FOUND);
			}

			return user.id;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new HttpException('Failed to resolve user', HttpStatus.BAD_GATEWAY);
		}
	}

	getCategories(query: CategoriesQueryDto): Promise<ICategoryItem[]> {
		return this.catalogService.getCategories(query);
	}

	createCategory(dto: CreateCategoryDto): Promise<ICategoryItem> {
		return this.catalogService.createCategory(dto);
	}

	getInputFormats(): Promise<IInputFormatItem[]> {
		return this.catalogService.getInputFormats();
	}

	createOutputType(dto: CreateOutputTypeDto): Promise<OutputTypes> {
		return this.catalogService.createOutputType(dto);
	}
}
