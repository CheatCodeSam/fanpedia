import Redis from '@ioc:Adonis/Addons/Redis'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Session, User } from '../Types'
import AuthenticationService from '@ioc:Authentication/Cognito'
import TokenService from '../Service/TokenService'
import * as jose from 'jose'
import g from '@ioc:Database/Gremlin'
import Logger from '@ioc:Adonis/Core/Logger'

export default class Authentication {
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    const sessionId = request.cookie('oidc_session')
    if (!sessionId) {
      response.status(401).send('No session cookie found')
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
          next()
        } else {
          throw new Error('Refresh Token Expired')
        }
      }
      const user = await g.V().has('user', 'cognito_id', session.sub).next()
      const userContext: User = {
        username: user.value.properties.username[0].value,
        cognitoId: user.value.properties.cognito_id[0].value,
        userVertex: user.value.id,
      }
    } catch (error) {
      Logger.warn(error)
      await Redis.del(`auth:session:${sessionId}`)
      response.clearCookie('oidc_session')
      response.status(401).send('Authentication failed, please log in again')
      return
    }
    await next()
  }
}
