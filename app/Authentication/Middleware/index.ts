import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class Authentication {
  public async handle({}: HttpContextContract, next: () => Promise<void>) {
    await next()
  }
}
