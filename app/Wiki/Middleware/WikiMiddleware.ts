import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import g from '@ioc:Database/Gremlin'

export default class WikiMiddleware {
	public async handle(
		{ subdomains, response, view }: HttpContextContract,
		next: () => Promise<void>
	) {
		const wikiSlug = subdomains.wiki
		if (!wikiSlug) {
			return response.badRequest('Wiki does not exist')
		}

		const wikiResult = await g
			.V()
			.has('wiki', 'slug', wikiSlug)
			.elementMap()
			.next()
		if (!wikiResult || !wikiResult.value) {
			return response.badRequest('Wiki does not exist')
		}

		view.share({ wiki: Object.fromEntries(wikiResult.value) })
		return next()
	}
}
