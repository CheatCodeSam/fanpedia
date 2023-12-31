import Route from '@ioc:Adonis/Core/Route'
import config from 'Config/cognito'
import AuthenticationService from '@ioc:Authentication/Cognito'
import { TokenService } from '../Service'
import Redis from '@ioc:Adonis/Addons/Redis'
import * as crypto from 'node:crypto'
import { Session } from '../Types'
import g from '@ioc:Database/Gremlin'

import { process } from 'gremlin'

Route.group(() => {
	Route.get('/callback', async ({ request, response }) => {
		const { code, state } = request.qs()
		if (!code) {
			response.status(400).send('No authorization code provided.')
			return
		}
		try {
			const token = await TokenService.getToken(code as string)
			await AuthenticationService.validateToken(token.access_token, 'access')
			const identity = await AuthenticationService.validateToken(
				token.id_token,
				'id'
			)

			await g
				.V()
				.has('user', 'cognito_id', identity.payload.sub)
				.fold()
				.coalesce(
					process.statics.unfold(),
					process.statics
						.addV('user')
						.property('username', identity.payload['cognito:username'])
						.property('cognito_id', identity.payload.sub)
						.property('email', identity.payload.email)
						.property('email_verified', identity.payload.email_verified)
				)
				.next()

			const tokens: Session = {
				sub: identity.payload.sub as string,
				username: identity.payload['cognito:username'] as string,
				accessToken: token.access_token,
				refreshToken: token.refresh_token,
			}
			const sessionId = crypto.randomUUID()
			await Redis.set(`auth:session:${sessionId}`, JSON.stringify(tokens))
			response.cookie('oidc_session', sessionId, {
				domain: 'fanpedia-project.com',
			})
			const re = JSON.parse(state).re
			response.redirect(
				re ? `https://${Buffer.from(re, 'base64').toString('ascii')}` : '/'
			)
		} catch (error: any) {
			console.log(error)
			response.status(500).send('error')
		}
	}).as('callback')

	Route.get('/login', async ({ response, request }) => {
		const redirect = request.qs().redirect || ''
		const scope = encodeURIComponent('openid profile phone email')
		const responseType = 'code'
		const authUrl = `https://${config.domain}.auth.${config.region}.amazoncognito.com/login?response_type=${responseType}&client_id=${config.client_id}&redirect_uri=${config.callback_url}&scope=${scope}&state={"re":"${redirect}"}`
		response.redirect(authUrl)
	}).as('login')

	Route.get('/exit', async ({ response, request }) => {
		const signOutUrl = `https://${config.domain}.auth.${config.region}.amazoncognito.com/logout?client_id=${config.client_id}&logout_uri=${config.logout_url}`
		const sessionId: string = request.cookie('oidc_session')
		if (sessionId) await Redis.del(`auth:session:${sessionId}`)
		response.clearCookie('oidc_session')
		response.redirect(signOutUrl)
	}).as('logout')
})
	.as('authentication')
	.domain('fanpedia-project.com')
