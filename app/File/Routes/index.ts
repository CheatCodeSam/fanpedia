import Route from '@ioc:Adonis/Core/Route'
Route.group(() => {})
  .as('file')
  .prefix('file')
  .middleware('authenticated')
