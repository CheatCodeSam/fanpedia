import Env from '@ioc:Adonis/Core/Env'

export default {
	client_id: Env.get('COGNITO_CLIENT_ID'),
	client_secret: Env.get('COGNITO_CLIENT_SECRET'),
	callback_url: Env.get('COGNITO_CALLBACK_URL'),
	logout_url: Env.get('COGNITO_LOGOUT_URL'),
	domain: Env.get('COGNITO_DOMAIN'),
	region: Env.get('COGNITO_REGION'),
	user_id_pool: Env.get('COGNITO_USER_ID_POOL'),
}
