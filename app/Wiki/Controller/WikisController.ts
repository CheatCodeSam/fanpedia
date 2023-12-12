import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import g from '@ioc:Database/Gremlin'
import { process } from 'gremlin'

export default class WikisController {
	public async create({ view, user, response }: HttpContextContract) {
		if (user) return view.render('Wiki/create')
		return response.redirect().toRoute('authentication.login')
	}

	public async store({ request, response, user }: HttpContextContract) {
		if (!user) return response.status(400).send('no user')
		const wikiSchema = schema.create({
			title: schema.string({ trim: true }, [rules.minLength(3)]),
			description: schema.string({ trim: true }, [rules.maxLength(155)]),
			slug: schema.string({ trim: true }, [
				rules.regex(/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/),
			]),
		})
		const payload = await request.validate({ schema: wikiSchema })
		const doesSubdomainAlreadyExist = await g
			.V()
			.has('wiki', 'slug', payload.slug)
			.hasNext()
		if (doesSubdomainAlreadyExist)
			return response.status(400).send('Wiki already exists')
		await g
			.addV('wiki')
			.as('a')
			.property('title', payload.title)
			.property('slug', payload.slug)
			.property('description', payload.description)
			.addE('created')
			.from_(process.statics.V(user.userVertex))
			.to('a')
			.next()
		return response
			.redirect()
			.toPath(`https://${payload.slug}.fanpedia-project.com`)
	}

	public async show({ view, subdomains }: HttpContextContract) {
		const { wiki } = subdomains
		const pages = await g
			.V()
			.has('wiki', 'slug', wiki)
			.in_('page_of')
			.elementMap()
			.fold()
			.next()
		const pagesobj = pages.value.map((p: Map<any, any>) =>
			Object.fromEntries(p)
		)
		return view.render('Wiki/show', { pages: pagesobj })
	}
}
