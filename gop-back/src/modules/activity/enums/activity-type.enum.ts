export enum ActivityTypeEnum {
	ACCOUNT_CREATED = 'account created',
	LOGIN = 'login',
	GOOGLE_LOGIN = 'google login',
	RESET_PASSWORD = 'reset password',
	UPDATE_PASSWORD = 'update password',

	PURCHASE = 'purchase succeeded',
	PURCHASE_FAILED = 'purchase failed',
	PURCHASE_REFUNDED = 'purchase refunded',

	SUBSCRIPTION_STARTED = 'subscription started',
	SUBSCRIPTION_CANCELED = 'subscription canceled',

	TRIAL_STARTED = 'trial started',
	TRIAL_ENDED = 'trial ended',

	PRODUCT_GRANTED = 'product granted',
}
