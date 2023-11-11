import Route from '@ioc:Adonis/Core/Route'
import config from 'Config/cognito'
import AuthenticationService from '@ioc:Authentication/Cognito'
import TokenService from '../Service/TokenService'

Route.group(() => {
  Route.get('/callback', async ({ request, response }) => {
    const { code } = request.qs()
    if (!code) {
      response.status(400).send('No code provided')
      return
    }
    try {
      const token = await TokenService.getToken(code as string)
      await AuthenticationService.validateToken(token.access_token, 'access')
      const identity = await AuthenticationService.validateToken(token.id_token, 'id')
      const tokens = {
        username: identity.payload['cognito:username'],
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
      }
      // const doc = await db.insertAsync(tokens)
      // res.cookie('oidc_session', doc._id, { signed: true })
      console.log(tokens)
      response.redirect('/')
    } catch (error: any) {
      response.status(500).send('error')
    }
  }).as('callback')

  Route.get('/login', async ({ response }) => {
    const scope = encodeURIComponent('openid profile phone email')
    const responseType = 'code'
    const authUrl = `https://${config.domain}.auth.${config.region}.amazoncognito.com/login?response_type=${responseType}&client_id=${config.client_id}&redirect_uri=${config.callback_url}&scope=${scope}`
    response.redirect(authUrl)
  }).as('login')

  Route.get('/logout', async ({}) => {}).as('logout')
}).as('authentication')
