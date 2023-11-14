import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'

Route.group(() => {
  Route.get('wiki/:wiki/page/create', async ({ user, params, response }) => {
    const { wiki } = params
    const doesWikiExist = await g.V().has('wiki', 'slug', wiki).hasNext()
    if (!doesWikiExist) return response.status(400).send('Wiki does not exists')
    if (!user) return response.redirect().toRoute('authentication.login')

    return 'ready'
  }).as('create')
})
  .as('page')
  .middleware('authenticated')
