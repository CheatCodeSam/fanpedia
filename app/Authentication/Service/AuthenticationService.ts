import { CachedJwkKeys, TokenClaim } from '../Types'
import * as jose from 'jose'

import config from 'Config/cognito'

export default class AuthenticationService {
  constructor(private readonly jwksKeys: CachedJwkKeys) {}

  public async validateToken(token: string, claim: TokenClaim) {
    const decodedToken = await jose.jwtVerify(token, this.jwksKeys, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${config.region}.amazonaws.com/${config.user_id_pool}`,
    })

    if (decodedToken.payload.token_use !== claim)
      throw new jose.errors.JWTClaimValidationFailed(`Missing required "${claim}" token_use.`)

    if (decodedToken.payload.token_use === 'id')
      if (decodedToken.payload.aud !== config.client_id) throw new jose.errors.JWTInvalid()
    if (decodedToken.payload.token_use === 'access')
      if (decodedToken.payload.client_id !== config.client_id) throw new jose.errors.JWTInvalid()

    return decodedToken
  }
}
