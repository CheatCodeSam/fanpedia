import g from "@ioc:Database/Gremlin";
import { WikiMetadata } from "../Types";
import type { ViewRendererContract } from "@ioc:Adonis/Core/View";
import WikiNotFoundException from "App/Exceptions/WikiNotFoundException";
import { MapToObjectService } from "App/Util/Service";



export default class WikiService {

	public static async getWikiBySubdomains(subdomains: Record<string, any>, view: ViewRendererContract ): Promise<WikiMetadata> {
		const wikiSlug = subdomains.wiki
		if (!wikiSlug) throw new WikiNotFoundException("Wiki cannot been found")
		const wiki = await WikiService.getWikiBySlug(wikiSlug)
		if(!wiki)
			throw new WikiNotFoundException("Wiki cannot been found")
		view.share({ wiki: wiki })
		return wiki
	}


	public static async getWikiBySlug(slug: string): Promise<WikiMetadata | null> {
		const wikiResult = await g
		.V()
		.has('wiki', 'slug', slug)
		.elementMap()
		.next()
		if (!wikiResult.value) return null
		return MapToObjectService.toObject(wikiResult.value) as WikiMetadata
	}
}
