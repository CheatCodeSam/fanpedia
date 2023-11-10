import { CachedJwkKeys } from '../Types'

export default class AuthenticationService {
  constructor(private readonly jwksKeys: CachedJwkKeys) {}

  public async print() {
    console.log(this.jwksKeys)
  }
}
