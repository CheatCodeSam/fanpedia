import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import g from '@ioc:Database/Gremlin'

export default class WikiMiddleware {
	public async handle(ctx: HttpContextContract, next: () => Promise<void>) {
		const { subdomains, response, view } = ctx
		const wikiSlug = subdomains.wiki
		if (!wikiSlug) return response.badRequest('Wiki does not exist')
		const wikiResult = await g
			.V()
			.has('wiki', 'slug', wikiSlug)
			.elementMap()
			.next()
		if (!wikiResult.value) return response.badRequest('Wiki does not exist')
		ctx.wiki = Object.fromEntries(wikiResult.value) as any
		view.share({ wiki: Object.fromEntries(wikiResult.value) })
		return next()
	}
}
