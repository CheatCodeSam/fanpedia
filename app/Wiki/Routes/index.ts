import Route from '@ioc:Adonis/Core/Route'
import '../Controller/WikisController'

Route.group(() => {
  Route.get('create', async (ctx) => {
    const { default: WikisController } = await import('../Controller/WikisController')
    return new WikisController().create(ctx)
  }).as('create')
  Route.post('/', async (ctx) => {
    const { default: WikisController } = await import('../Controller/WikisController')
    return new WikisController().store(ctx)
  }).as('store')
})
  .as('wiki')
  .prefix('wiki')
  .middleware('authenticated')
