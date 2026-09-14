import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { DeleteAccountDto } from '../dto';

export function ApiDeleteAccount() {
	return applyDecorators(
		ApiBearerAuth(),
		ApiOperation({
			summary: 'DANGER ZONE: delete account',
		}),
		ApiBody({
			type: DeleteAccountDto,
			examples: {
				default: {
					summary: 'Delete account using password',
					value: {
						password: 'your_password_here',
					},
				},
			},
		}),
	);
}
