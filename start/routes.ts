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
import g from '@ioc:Database/Gremlin'

import 'App/Authentication/Routes'
import 'App/Wiki/Routes'
import 'App/Page/Routes'

Route.get('/', async ({ view, user }) => {
  return user ? user.username : 'Not logged in'
  // return view.render('welcome')
}).middleware('authenticated')

Route.get('/neptune', async ({}) => {
  console.log(g)
  const john = await g.addV('person').property('name', 'John').next()
  g.V().has('postId', 'test').property('name', 'Carson').property('Hello', 'world').next()
  return 'Vertex added:' + john.value
})
