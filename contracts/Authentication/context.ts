declare module '@ioc:Adonis/Core/HttpContext' {
	import { User } from 'App/Authentication/Types'

	interface HttpContextContract {
		user: User | null
	}
}
