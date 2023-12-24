declare module '@ioc:Adonis/Core/HttpContext' {
	import type { WikiMetadata } from 'App/Wiki/Types'

	interface HttpContextContract {
		wiki: WikiMetadata
	}
}
