import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from '../entities/users.entity';
import { MinioClientService } from '../../minio/services/minio-client.service';

@Injectable()
export class UserMediaService {
	private readonly bucket = process.env.MLFLOW_BUCKET_NAME!;

	constructor(
		private readonly minio: MinioClientService,

		@InjectRepository(User)
		private readonly userRepo: Repository<User>,
	) {}

	async getAvatarUrl(userId: string): Promise<string | null> {
		const user = await this.userRepo.findOne({
			where: { id: userId },
			select: ['id', 'avatar'] as any,
		});

		if (!user?.avatar) return null;

		return this.generateUrl(user.avatar);
	}

	async uploadAvatar(userId: string, file: Express.Multer.File): Promise<string> {
		if (!file) throw new BadRequestException('File is required');

		const allowed = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowed.includes(file.mimetype)) {
			throw new BadRequestException('Only JPG, PNG, WEBP allowed');
		}

		try {
			await this.deleteAvatarIfExists(userId);

			const key = `avatars/${userId}/${uuid()}-${Date.now()}`;

			await this.minio.getClient().putObject(this.bucket, key, file.buffer, file.size, {
				'Content-Type': file.mimetype,
			});

			await this.userRepo.update({ id: userId }, { avatarKey: key } as any);

			return key;
		} catch (err) {
			throw new InternalServerErrorException('Avatar upload failed');
		}
	}

	async deleteAvatarIfExists(userId: string): Promise<void> {
		const user = await this.userRepo.findOne({
			where: { id: userId },
			select: ['id', 'avatarKey'] as any,
		});

		if (!user?.avatar) return;

		try {
			await this.minio.getClient().removeObject(this.bucket, user.avatar);

			await this.userRepo.update({ id: userId }, { avatarKey: null } as any);
		} catch {
			// silent fail (same behavior as before)
		}
	}

	private generateUrl(key: string): string {
		if (process.env.MINIO_PUBLIC === 'true') {
			return `${process.env.MINIO_PUBLIC_URL}/${this.bucket}/${key}`;
		}

		return this.minio.getClient().presignedGetObject(
			this.bucket,
			key,
			60 * 60, // 1h
		) as unknown as string;
	}
}
