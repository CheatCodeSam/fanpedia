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
    const now = new Date().toISOString()
    await g
      // Create a new vertex for the page as a
      .addV('page')
      .as('a')
      .property('title', payload.title)
      .property('slug', payload.slug)
      .property('date', now)
      // Get the user vertex as b
      .V(user.userVertex)
      .as('b')
      // Create an edge to represent that this user created this page
      .addE('created')
      .from_('b')
      .to('a')
      // Link the page to a specific wiki
      .addE('page_of')
      .from_(process.statics.V().has('wiki', 'slug', wiki))
      .to('a')
      // Create a new vertex for the page's initial revision
      .addV('revision')
      .as('c')
      .property('body', payload.body)
      .property('date', now)
      .property('status', 'approved')
      // Create a 'main' edge to denote this is the current revision of the page
      .addE('main')
      .from_('a')
      .to('c')
      // Link the revision to the page
      .addE('edit_of')
      .from_('a')
      .to('c')
      // Link the revision to the user who made it
      .addE('edited_by')
      .from_('b')
      .to('c')
      .next()
    return response.redirect().toRoute('page.show', { wiki: wiki, page: payload.slug })
  }).as('store')

  Route.get('wiki/:wiki/page/:page', async ({ params, response, view }) => {
    const { wiki, page } = params
    const retval = await g
      .V()
      .has('wiki', 'slug', wiki)
      .out('of')
      .has('page', 'slug', page)
      .project('pageInfo', 'mainRevision')
      .by(process.statics.elementMap('title', 'slug', 'date'))
      .by(process.statics.out('main').elementMap('body', 'date', 'status'))
      .next()
    console.log(retval.value)
    if (!retval.value) return response.status(404).send('Page not found.')
    return view.render('Page/show', {
      page: Object.fromEntries(retval.value.get('pageInfo')),
      revision: Object.fromEntries(retval.value.get('mainRevision')),
    })
  }).as('show')

  Route.get('wiki/:wiki/page/:page/edit', async ({ params, response, user, view }) => {
    if (!user) return response.redirect().toRoute('authentication.login')
    const { wiki, page } = params
    const wikiPage = await g
      .V()
      .has('wiki', 'slug', wiki)
      .out('of')
      .has('page', 'slug', page)
      .project('pageInfo', 'mainRevision')
      .by(process.statics.elementMap('title', 'slug', 'date'))
      .by(process.statics.out('main').elementMap('body', 'date', 'status'))
      .next()
    if (!wikiPage) return response.status(400).send('Wiki does not exists')
    return view.render('Page/edit', {
      page: Object.fromEntries(wikiPage.value.get('pageInfo')),
      revision: Object.fromEntries(wikiPage.value.get('mainRevision')),
    })
  }).as('edit')

  Route.post('wiki/:wiki/page/:page', async ({ params, response, user, request }) => {
    const { wiki, page } = params
    if (!user) return response.status(400).send('no user')
    const editPageSchema = schema.create({
      body: schema.string({ trim: true }, [rules.maxLength(155)]),
    })
    const payload = await request.validate({ schema: editPageSchema })
    console.log(payload)
  }).as('update')
})
  .as('page')
  .middleware('authenticated')
