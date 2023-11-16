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
      // user created this page
      .addE('created')
      .from_('b')
      .to('a')
      // page is a page of the wiki
      .addE('page_of')
      .from_('a')
      .to(process.statics.V().has('wiki', 'slug', wiki))
      // Create a new vertex for the page's initial revision
      .addV('revision')
      .as('c')
      .property('body', payload.body)
      .property('date', now)
      .property('status', 'approved')
      .property('comment', 'Initial revision')
      // Create a 'main' edge to denote this is the current revision of the page
      .addE('main')
      .from_('a')
      .to('c')
      // revision is edit of page
      .addE('edit_of')
      .from_('c')
      .to('a')
      // user edited revision
      .addE('edited')
      .from_('b')
      .to('c')
      .next()
    return response.redirect().toRoute('page.show', { wiki: wiki, page: payload.slug })
  }).as('store')

  Route.get('wiki/:wiki/page/:page', async ({ params, request, response, view }) => {
    const { wiki, page } = params
    const revision: string | undefined = request.qs().revision
    let val = g
      .V()
      .has('wiki', 'slug', wiki)
      .in_('page_of')
      .has('page', 'slug', page)
      .project('pageInfo', 'mainRevision')
      .by(process.statics.elementMap('title', 'slug', 'date'))
    if (revision) {
      val = val.by(
        process.statics.in_('edit_of').hasId(revision).elementMap('body', 'date', 'status')
      )
    } else {
      val = val.by(process.statics.out('main').elementMap('body', 'date', 'status'))
    }
    const retval = await val.next()
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
      .in_('page_of')
      .has('page', 'slug', page)
      .project('pageInfo', 'mainRevision', 'previousEditor')
      .by(process.statics.elementMap('title', 'slug', 'date'))
      .by(process.statics.out('main').elementMap('body', 'date', 'status'))
      .by(process.statics.out('main').in_('edited').elementMap('username'))
      .next()
    if (!wikiPage) return response.status(400).send('Wiki does not exists')
    return view.render('Page/edit', {
      page: Object.fromEntries(wikiPage.value.get('pageInfo')),
      revision: Object.fromEntries(wikiPage.value.get('mainRevision')),
      previousEditor: Object.fromEntries(wikiPage.value.get('previousEditor')),
    })
  }).as('edit')

  Route.post('wiki/:wiki/page/:page', async ({ params, response, user, request }) => {
    const { wiki, page } = params
    //TODO What if wiki/page doesnt exist?
    if (!user) return response.status(400).send('no user')
    const editPageSchema = schema.create({
      body: schema.string({ trim: true }, []),
      comment: schema.string({ trim: true }, []),
      revision: schema.string({ trim: true }, []),
    })
    const payload = await request.validate({ schema: editPageSchema })
    const now = new Date().toISOString()
    await g
      // create revision as a
      .addV('revision')
      .as('a')
      .property('date', now)
      .property('status', 'pending')
      .property('body', payload.body)
      .property('comment', payload.comment)
      // get page vertex as b
      .V()
      .has('wiki', 'slug', wiki)
      .in_('page_of')
      .has('page', 'slug', page)
      .as('b')
      // Get the user vertex as c
      .V(user.userVertex)
      .as('c')
      // revision is edit of page
      .addE('edit_of')
      .from_('a')
      .to('b')
      // user edited revision
      .addE('edited')
      .from_('c')
      .to('a')
      .addE('branched_from')
      .from_('a')
      .to(process.statics.V(payload.revision))
      .next()

    return response.redirect().toRoute('page.show', { wiki: wiki, page: page })
  }).as('update')

  Route.get('wiki/:wiki/page/:page/revisions', async ({ params, response, user, view }) => {
    if (!user) return response.redirect().toRoute('authentication.login')
    const { wiki, page } = params
    //TODO does page and wiki exist?

    const x = await g
      .V()
      .has('wiki', 'slug', wiki)
      .in_('page_of')
      .has('page', 'slug', page)
      .in_('edit_of')
      .has('revision', 'status', 'pending')
      .elementMap()
      .fold()
      .next()

    const retVal = x.value.map((map: Map<any, any>) => Object.fromEntries(map))
    return view.render('Page/revisions', {
      revisions: retVal,
    })
  }).as('revisions')
})
  .as('page')
  .middleware('authenticated')
