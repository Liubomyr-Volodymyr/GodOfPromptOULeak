import { PROJECT_KEY } from '../../../common/enums';

export class AssistantAttrs {
	assistantId: string;
	prompt: string;
	project_key: PROJECT_KEY;
	responseFormat?: 'json_object' | 'text';
}

export class AssistantResponse {
	content: string;
}
