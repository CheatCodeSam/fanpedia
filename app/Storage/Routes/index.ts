import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'
import { schema } from '@ioc:Adonis/Core/Validator'

Route.group(() => {
	Route.get('wiki/:wiki/upload', async ({ user, response, params, view }) => {
		if (!user) return response.status(400).send('no user')
		const { wiki } = params
		const doesWikiExist = await g.V().has('wiki', 'slug', wiki).hasNext()
		if (!doesWikiExist) return response.status(400).send('Wiki does not exists')
		return view.render('File/create')
	}).as('create')

	Route.post('wiki/:wiki/', async ({ request, user, response }) => {
		if (!user) return response.status(400).send('no user')
		const uploadSchema = schema.create({
			image: schema.file({
				size: '2mb',
				extnames: ['jpg', 'gif', 'png'],
			}),
			description: schema.string([]),
		})
		const payload = await request.validate({ schema: uploadSchema })
		// do something
		return payload
	}).as('store')
})
	.as('file')
	.middleware('authenticated')

Route.get('file/:key/*', async ({ params }) => {
	const { key } = params
	return key
}).as('file')
