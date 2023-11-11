import Redis from '@ioc:Adonis/Addons/Redis'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class Authentication {
  public async handle({ request }: HttpContextContract, next: () => Promise<void>) {
    const sessionID = request.cookie('oidc_session')
    const sessionStr = await Redis.get(`auth:session:${sessionID}`)
    const session = JSON.parse(sessionStr)
    console.log(session)
    await next()
  }
}
