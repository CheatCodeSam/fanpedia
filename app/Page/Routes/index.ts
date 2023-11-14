import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'
import { process } from 'gremlin'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

Route.group(() => {
  Route.get('wiki/:wiki/page/create', async ({ user, params, response, view }) => {
    const { wiki } = params
    const doesWikiExist = await g.V().has('wiki', 'slug', wiki).hasNext()
    if (!doesWikiExist) return response.status(400).send('Wiki does not exists')
    if (!user) return response.redirect().toRoute('authentication.login')
    return view.render('Page/create')
  }).as('create')

  Route.post('wiki/:wiki/page', async ({ request, user, params, response }) => {
    const { wiki } = params
    const doesWikiExist = await g.V().has('wiki', 'slug', wiki).hasNext()
    if (!doesWikiExist) return response.status(400).send('Wiki does not exists')
    if (!user) return response.redirect().toRoute('authentication.login')
    const pageSchema = schema.create({
      title: schema.string({ trim: true }, [rules.minLength(3)]),
      body: schema.string({ trim: true }, [rules.maxLength(155)]),
      slug: schema.string({ trim: true }, [rules.regex(/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/)]),
    })
    const payload = await request.validate({ schema: pageSchema })
    const doesPageAlreadyExists = await g
      .V()
      .has('wiki', 'slug', wiki)
      .out()
      .has('page', 'slug', payload.slug)
      .hasNext()
    if (doesPageAlreadyExists) return response.status(400).send('Page already exists')
    await g
      .addV('page')
      .as('a')
      .property('title', payload.title)
      .property('slug', payload.slug)
      .property('body', payload.body)
      .addE('created')
      .from_(process.statics.V(user.userVertex))
      .to('a')
      .addE('of')
      .from_(process.statics.V().has('wiki', 'slug', wiki))
      .to('a')
      .next()
    return response.redirect().toRoute('page.show', { wiki: wiki, page: payload.slug })
  }).as('store')

  Route.get('wiki/:wiki/page/:page', async ({ params, response, view }) => {
    const { wiki, page } = params
    const retval = await g
      .V()
      .has('wiki', 'slug', wiki)
      .out()
      .has('page', 'slug', page)
      .elementMap()
      .next()
    if (!retval.value) return response.status(404).send('Page not found.')
    return view.render('Page/show', Object.fromEntries(retval.value))
  }).as('show')
})
  .as('page')
  .middleware('authenticated')
