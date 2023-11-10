import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import AuthenticationService from '@ioc:Authentication/Cognito'

export default class Authentication {
  public async handle({}: HttpContextContract, next: () => Promise<void>) {
    AuthenticationService.print()
    await next()
  }
}
