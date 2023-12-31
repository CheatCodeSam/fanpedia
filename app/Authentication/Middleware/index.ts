import Redis from '@ioc:Adonis/Addons/Redis'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Session, User } from '../Types'
import AuthenticationService from '@ioc:Authentication/Cognito'
import { TokenService } from '../Service'
import * as jose from 'jose'
import g from '@ioc:Database/Gremlin'
import Logger from '@ioc:Adonis/Core/Logger'
import { process } from 'gremlin'

export default class Authentication {
	public async handle(ctx: HttpContextContract, next: () => Promise<void>) {
		const { request, response, view } = ctx
		ctx.user = null
		const sessionId = request.cookie('oidc_session')
		if (!sessionId) {
			return next()
		}
		try {
			const sessionStr = await Redis.get(`auth:session:${sessionId}`)
			if (!sessionStr) {
				throw new Error('Session not found')
			}
			const session: Session = JSON.parse(sessionStr)
			try {
				await AuthenticationService.validateToken(session.accessToken, 'access')
			} catch (error) {
				if (error instanceof jose.errors.JWTExpired) {
					const newToken = await TokenService.getAccessTokenWithRefreshToken(
						session.refreshToken
					)
					await AuthenticationService.validateToken(newToken, 'access')
					session.accessToken = newToken
					await Redis.set(`auth:session:${sessionId}`, JSON.stringify(session))
				} else {
					throw new Error('Refresh Token Expired')
				}
			}
			const user = await g
				.V()
				.has('user', 'cognito_id', session.sub)
				.elementMap('id', 'username', 'cognito_id')
				.next()
			const userContext: User = {
				cognitoId: user.value.get('cognito_id'),
				username: user.value.get('username'),
				userVertex: user.value.get(process.t.id),
			}
			view.share({ user: userContext })
			ctx.user = userContext
		} catch (error) {
			Logger.warn(error)
			await Redis.del(`auth:session:${sessionId}`)
			response.clearCookie('oidc_session')
		}
		return next()
	}
}
