/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer''
|
*/

import Route from '@ioc:Adonis/Core/Route'
import Redis from '@ioc:Adonis/Addons/Redis'

import 'App/Authentication/Routes'
import 'App/Wiki/Routes'
import 'App/Page/Routes'
import 'App/Revision/Routes'
import 'App/Storage/Routes'
import 'App/Health/Routes'
import g from '@ioc:Database/Gremlin'

Route.get('/', async ({ user }) => {
  return user ? user.username : 'Not logged in'
})
  .middleware('authenticated')
  .domain('fanpedia-project.com')

Route.get('/s', async ({ user }) => {
  const x = await g.V().count().next()

  return x.value
})
  .middleware('authenticated')
  .domain('fanpedia-project.com')
