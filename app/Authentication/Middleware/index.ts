import Redis from '@ioc:Adonis/Addons/Redis'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Session, User } from '../Types'
import AuthenticationService from '@ioc:Authentication/Cognito'
import TokenService from '../Service/TokenService'
import * as jose from 'jose'
import g from '@ioc:Database/Gremlin'
import Logger from '@ioc:Adonis/Core/Logger'

export default class Authentication {
  public async handle(ctx: HttpContextContract, next: () => Promise<void>) {
    const { request, response } = ctx
    ctx.user = null
    const sessionId = request.cookie('oidc_session')
    if (!sessionId) {
      await next()
      return
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
          const newToken = await TokenService.getAccessTokenWithRefreshToken(session.refreshToken)
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
        .valueMap('username', 'cognito_id')
        .next()

      const userContext: User = {
        username: user.value.get('username')[0],
        cognitoId: user.value.get('cognito_id')[0],
        userVertex: user.value.id,
      }
      ctx.user = userContext
    } catch (error) {
      Logger.warn(error)
      await Redis.del(`auth:session:${sessionId}`)
      response.clearCookie('oidc_session')
    }
    await next()
  }
}
