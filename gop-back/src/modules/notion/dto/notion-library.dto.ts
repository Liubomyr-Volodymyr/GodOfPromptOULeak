import { IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum LibraryStatus {
	PUBLISHED = 'Published',
	PENDING = 'Pending',
	REJECTED = 'Rejected',
}

export class UpdateLibraryDto {
	@IsString()
	notion_id: string;

	@IsString({ message: 'name must be string' })
	name: string;

	@IsString({ message: 'sub_category must be string' })
	sub_category: string;

	@Transform(({ value }) => {
		if (typeof value === 'string') {
			const normalized = value.toLowerCase();
			switch (normalized) {
				case 'published':
					return LibraryStatus.PUBLISHED;
				case 'pending':
					return LibraryStatus.PENDING;
				case 'rejected':
					return LibraryStatus.REJECTED;
				default:
					return value;
			}
		}
		return value;
	})
	@IsEnum(LibraryStatus)
	status: LibraryStatus;
}

export class DeleteLibraryItemDto {
	@IsString()
	notion_id: string;
}
