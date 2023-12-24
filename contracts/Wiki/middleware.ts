declare module '@ioc:Adonis/Core/HttpContext' {
	interface HttpContextContract {
		wiki: {
			description: string
			title: string
			slug: string
			id: number
			label: string
		}
	}
}
