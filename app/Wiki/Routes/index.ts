import Route from '@ioc:Adonis/Core/Route'
import '../Controller/WikisController'

Route.group(() => {
  Route.get('wiki/create', async (ctx) => {
    const { default: WikisController } = await import('../Controller/WikisController')
    return new WikisController().create(ctx)
  }).as('create')
  Route.post('wiki', async (ctx) => {
    const { default: WikisController } = await import('../Controller/WikisController')
    return new WikisController().store(ctx)
  }).as('store')
})
  .as('wiki')
  .namespace('wiki')
  .middleware('authenticated')
