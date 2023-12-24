import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { process } from 'gremlin'
import { MapToObjectService } from 'App/Util/Service'

Route.group(() => {
	Route.get('wiki/create', async ({ user, view, response }) => {
		if (user) return view.render('Wiki/create')
		return response.redirect('https://fanpedia-project.com/login')
	})
		.as('create')
		.domain('fanpedia-project.com')

	Route.post('wiki', async ({ user, request, response }) => {
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

		const PS = process.statics
		await g
			.addV('wiki')
			.as('a')
			.property('title', payload.title)
			.property('slug', payload.slug)
			.property('description', payload.description)
			.addE('created')
			.from_(PS.V(user.userVertex))
			.to('a')
			.addE('moderates')
			.from_(PS.V(user.userVertex))
			.to('a')
			.next()
		return response
			.redirect()
			.toPath(`https://${payload.slug}.fanpedia-project.com`)
	})
		.as('store')
		.domain('fanpedia-project.com')

	Route.get('/', async ({ view, wiki }) => {
		const pages = await g.V(wiki.id).in_('page_of').elementMap().fold().next()
		const pagesobj = pages.value.map((p) => MapToObjectService.toObject(p))
		return view.render('Wiki/show', { pages: pagesobj })
	})
		.as('show')
		.domain(':wiki.fanpedia-project.com')
		.middleware('wiki')
})
	.as('wiki')
	.middleware('authenticated')
