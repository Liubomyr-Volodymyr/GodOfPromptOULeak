import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
	@ApiProperty({
		description:
			'The refresh token obtained during login or previous refresh',
		example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
	})
	@IsNotEmpty()
	@IsString()
	refresh_token: string;
}
