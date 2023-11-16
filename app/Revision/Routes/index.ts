import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'
import { process } from 'gremlin'
import { schema, rules } from '@ioc:Adonis/Core/Validator'

//TODO make these post requests
Route.group(() => {
  Route.get(':revision/approve', async ({ params, user, response }) => {
    if (!user) return response.redirect('/login')
    const { revision } = params

    const revisionExists = await g.V(revision).hasNext()
    if (!revisionExists) return response.status(404)

    await g
      .V(revision)
      .property('status', 'approved')
      .as('approvedRevision')
      .out('edit_of')
      .as('page')
      .sideEffect(process.statics.outE('main').drop())
      .addE('main')
      .from_('page')
      .to('approvedRevision')
      .next()

    return 'sucess'
  }).as('approve')
  Route.get(':revision/reject', async ({}) => {}).as('reject')
})
  .as('revision')
  .prefix('revision')
  .middleware('authenticated')
