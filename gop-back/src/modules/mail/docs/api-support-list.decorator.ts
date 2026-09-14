import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { SupportListDto } from '../../../infra/mailer/dto';
import { ApiUnauthorizedResponse } from '../../../common/decorators';

export function ApiSupportMail() {
	return applyDecorators(
		ApiOperation({
			summary: 'Send a support message to admin/support email',
			description:
				'Sends a support message from the authenticated user to a fixed support address. Subject and message are required.',
		}),
		ApiBody({
			type: SupportListDto,
			examples: {
				default: {
					summary: 'Support email payload',
					value: {
						subject: 'Bug: Extension not working',
						message:
							'The extension crashes every time I open a new tab.',
					},
				},
			},
		}),
		ApiResponse({
			status: 200,
			description: 'Support message sent successfully',
			schema: {
				example: {
					message: 'Support email sent to support@example.com',
				},
			},
		}),
		ApiUnauthorizedResponse(),
		ApiResponse({
			status: 400,
			description:
				'Bad Request: subject or message is missing or invalid',
		}),
	);
}
