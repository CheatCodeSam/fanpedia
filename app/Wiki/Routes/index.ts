import Route from '@ioc:Adonis/Core/Route'
import '../Controller/WikisController'

Route.group(() => {
	Route.get('wiki/create', async (ctx) => {
		const { default: WikisController } = await import(
			'../Controller/WikisController'
		)
		return new WikisController().create(ctx)
	})
		.as('create')
		.domain('fanpedia-project.com')

	Route.post('wiki', async (ctx) => {
		const { default: WikisController } = await import(
			'../Controller/WikisController'
		)
		return new WikisController().store(ctx)
	})
		.as('store')
		.domain('fanpedia-project.com')

	Route.get('/', async (ctx) => {
		const { default: WikisController } = await import(
			'../Controller/WikisController'
		)
		return new WikisController().show(ctx)
	})
		.as('show')
		.domain(':wiki.fanpedia-project.com')
		.middleware('wiki')
})
	.as('wiki')
	.middleware('authenticated')
