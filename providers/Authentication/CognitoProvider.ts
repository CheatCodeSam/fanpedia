import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class CognitoProvider {
  constructor(protected app: ApplicationContract) {}

  public async register() {
    const config = this.app.config.get('cognito')
    const jose = await import('jose')
    const authenticationService = await import('App/Authentication/Service')
    const keys = jose.createRemoteJWKSet(
      new URL(
        `https://cognito-idp.${config.region}.amazonaws.com/${config.user_id_pool}/.well-known/jwks.json`
      )
    )
    this.app.container.singleton('Authentication/Cognito', () => {
      return new authenticationService.default(keys)
    })
  }

  public async boot() {
    // IoC container is ready
  }

  public async ready() {
    // App is ready
  }

  public async shutdown() {
    // Cleanup, since app is going down
  }
}
