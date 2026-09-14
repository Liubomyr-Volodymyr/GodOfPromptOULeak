import { Injectable, OnModuleInit } from '@nestjs/common';
import { drive_v3 } from '@googleapis/drive';
import { auth } from '@googleapis/oauth2';
import { Readable } from 'stream';
import dayjs from 'dayjs';
import { UploadFileDto } from '../dto/google-drive.dto';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
	private drive: drive_v3.Drive;

	constructor() {
		const googleAuth = new auth.GoogleAuth({
			credentials: {
				client_email: process.env.GOOGLE_CLIENT_EMAIL,
				private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			},
			scopes: ['https://www.googleapis.com/auth/drive'],
		});

		this.drive = new drive_v3.Drive({
			auth: googleAuth,
		});
	}

	private bufferToStream(buffer: Buffer): Readable {
		const stream = new Readable();
		stream.push(buffer);
		stream.push(null);
		return stream;
	}

	async onModuleInit(): Promise<void> {
		try {
			await this.drive.files.get({
				fileId: process.env.GOOGLE_MASTER_FOLDER_ID,
				fields: 'id, name',
			});
		} catch (error) {
			console.error('Error accessing master folder:', error);
			throw error;
		}
	}

	private async findOrCreateEmailFolder(email: string): Promise<string> {
		try {
			const response = await this.drive.files.list({
				q: `name = '${email}' and mimeType = 'application/vnd.google-apps.folder' and '${process.env.GOOGLE_MASTER_FOLDER_ID}' in parents`,
				fields: 'files(id, name)',
				spaces: 'drive',
			});

			if (response.data.files.length > 0) {
				return response.data.files[0].id;
			}

			const fileMetadata = {
				name: email,
				mimeType: 'application/vnd.google-apps.folder',
				parents: [process.env.GOOGLE_MASTER_FOLDER_ID],
			};

			const folder = await this.drive.files.create({
				requestBody: fileMetadata,
				fields: 'id',
			});

			return folder.data.id;
		} catch (error) {
			console.error('Error finding/creating email folder:', error);
			throw error;
		}
	}

	async uploadFile(dataDto: UploadFileDto): Promise<string> {
		try {
			const folderId = await this.findOrCreateEmailFolder(dataDto.email);
			const fileName = `${dataDto.filename}[${dayjs().format('YYYY-MM-DD_HH-mm-ss')}].${dataDto.extension}`;

			const mimeTypes: Record<string, string> = {
				pdf: 'application/pdf',
				csv: 'text/csv',
			};

			const fileMetadata = {
				name: fileName,
				parents: [folderId],
			};

			const media = {
				mimeType: mimeTypes[dataDto.extension] || 'application/octet-stream',
				body: this.bufferToStream(dataDto.buffer),
			};

			const file = await this.drive.files.create({
				requestBody: fileMetadata,
				media: media,
				fields: 'id, webViewLink',
			});

			await this.drive.permissions.create({
				fileId: file.data.id,
				requestBody: {
					role: 'reader',
					type: 'anyone',
				},
			});

			return file.data.webViewLink;
		} catch (error) {
			console.error('Error uploading file:', error);
			throw error;
		}
	}
}
