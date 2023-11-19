import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'
import { process } from 'gremlin'

//TODO make these post requests
Route.group(() => {
  Route.get(':revision/approve', async ({ params, user, response }) => {
    if (!user) return response.redirect('/login')
    const { revision } = params

    const revisionExists = await g.V(revision).hasNext()
    if (!revisionExists) return response.status(404)

    const PS = process.statics
    const values = await g
      .V(revision)
      .project('revision', 'main', 'commonAncestor')
      .by(PS.elementMap('body'))
      .by(PS.out('edit_of').out('main').elementMap('body'))
      .by(PS.out('branched_from').elementMap('body'))
      .next()

    const project = values.value
    console.log(project)
    if (project.get('main').get(process.t.id) === project.get('commonAncestor').get(process.t.id))
      console.log('fast forward')

    const retval = await g
      .V(revision)
      .property('status', 'approved')
      .as('approvedRevision')
      .out('edit_of')
      .as('page')
      .sideEffect(PS.outE('main').drop())
      .addE('main')
      .from_('page')
      .to('approvedRevision')
      .select('page')
      .project('pageSlug', 'wikiSlug')
      .by('slug')
      .by(PS.out('page_of').values('slug'))
      .next()

    return response.redirect().toRoute('page.show', {
      wiki: retval.value.get('wikiSlug'),
      page: retval.value.get('pageSlug'),
    })
  }).as('approve')
  Route.get(':revision/reject', async ({ user, response, params }) => {
    if (!user) return response.redirect('/login')
    const { revision } = params

    const revisionExists = await g.V(revision).has('status', 'pending').hasNext()
    if (!revisionExists) return response.status(404)

    await g.V(revision).property('status', 'rejected').next()

    return 'sucess'
  }).as('reject')
})
  .as('revision')
  .prefix('revision')
  .middleware('authenticated')
