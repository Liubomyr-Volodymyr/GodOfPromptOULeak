import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
	NODE_ENV: Joi.string().valid('local', 'development', 'production').default('local'),

	APP_TITLE: Joi.string().optional(),
	APP_PORT: Joi.number().default(4000),

	API_KEY: Joi.string().optional(),
	FREE_REQUESTS_COUNT: Joi.number().optional(),

	JWT_SECRET: Joi.string().required(),
	JWT_EXPIRES_IN: Joi.string().default('3d'),
	JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

	ADMIN_ROOT_EMAIL: Joi.string().required(),
	ADMIN_ROOT_PASSWORD: Joi.string().required(),
	ADMIN_JWT_SECRET: Joi.string().required(),
	ADMIN_JWT_EXPIRES_IN: Joi.string().default('3d'),

	POSTGRES_HOST: Joi.string().required(),
	POSTGRES_USER: Joi.string().required(),
	POSTGRES_PASSWORD: Joi.string().required(),
	POSTGRES_DB: Joi.string().required(),
	POSTGRES_PORT: Joi.number().default(5432),
	POSTGRES_TIMEZONE: Joi.string().default('+00:00'),

	POSTMARK_API_KEY: Joi.string().required(),
	EMAIL_FROM_NAME: Joi.string().required(),
	EMAIL_FROM_ADDRESS: Joi.string().email().required(),
	SUPPORT_EMAIL: Joi.string().email().required(),

	REDIS_HOST: Joi.string().required(),
	REDIS_PORT: Joi.number().default(6380),

	GOTENBERG_URL: Joi.string().optional(),
	GOTENBERG_PORT: Joi.number().optional(),

	MLFLOW_PORT: Joi.number().optional(),
	MLFLOW_TRACKING_URI: Joi.string().uri().optional(),
	MLFLOW_BUCKET_NAME: Joi.string().optional(),
	MLFLOW_SECRET_KEY: Joi.string().optional(),

	OPENAI_ASST_HTML: Joi.string().optional(),
	OPENAI_CUSTOM_API_KEY: Joi.string().optional(),
	OPENAI_INTERNAL_API_KEY: Joi.string().optional(),
	OPENAI_CONTEXT_API_KEY: Joi.string().optional(),
	ANTHROPIC_API_KEY: Joi.string().optional(),
	GEMINI_API_KEY: Joi.string().optional(),

	NOTION_API_KEY: Joi.string().optional(),
	NOTION_CUSTOM_HISTORY_ID: Joi.string().optional(),
	NOTION_CUSTOM_PROMPTS_ID: Joi.string().optional(),
	NOTION_INTERNAL_PROMPTS_ID: Joi.string().optional(),

	GOOGLE_CLIENT_ID: Joi.string().required(),
	GOOGLE_CLIENT_SECRET: Joi.string().required(),
	GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

	GOOGLE_PROJECT_ID: Joi.string().optional(),
	GOOGLE_CLIENT_EMAIL: Joi.string().optional(),
	GOOGLE_PRIVATE_KEY: Joi.string().optional(),
	GOOGLE_MASTER_FOLDER_ID: Joi.string().optional(),

	STRIPE_SECRET_KEY: Joi.string().optional(),
	STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
	STRIPE_PRICE_ID: Joi.string().optional(),
	STRIPE_SUCCESS_URL: Joi.string().uri().optional(),
	STRIPE_CANCEL_URL: Joi.string().uri().optional(),

	URL_SITE_MAIN: Joi.string().uri().optional(),
	URL_GENERATE_FORM: Joi.string().uri().optional(),
	URL_PROMPT_LIBRARY: Joi.string().uri().optional(),
	URL_CONTACTS: Joi.string().uri().optional(),

	MINIO_PUBLIC_URL: Joi.string().optional(),
	MINIO_HOST: Joi.string().optional(),
	MINIO_PORT: Joi.number().optional(),
	MINIO_USE_SSL: Joi.boolean().optional(),
	MINIO_USER: Joi.string().optional(),
	MINIO_PASS: Joi.string().optional(),
	MINIO_MEDIA_BUCKET: Joi.string().optional(),

	QDRANT_URL: Joi.string().uri().optional(),
	QDRANT_API_KEY: Joi.string().optional(),
	QDRANT_CRON_SCHEDULE: Joi.string().optional(),

	FRONTEND_URL: Joi.string().uri().required(),

	POSTMARK_TEMPLATE_SIGNUP_WELCOME: Joi.number().optional(),
	POSTMARK_TEMPLATE_SIGNUP_LEAD_MAGNET: Joi.number().optional(),
	POSTMARK_TEMPLATE_DELIVERY_NOTIFICATION: Joi.number().optional(),
	POSTMARK_TEMPLATE_LEAD_MAGNET: Joi.number().optional(),

	BEEHIIV_API_KEY: Joi.string().optional(),
	BEEHIIV_PUBLICATION_GOP_PRODUCTS: Joi.string().optional(),
	BEEHIIV_PUBLICATION_GOP_MAIN: Joi.string().optional(),
});
