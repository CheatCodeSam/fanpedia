import type { createRemoteJWKSet } from 'jose'

export type TokenClaim = 'access' | 'id'

export type CachedJwkKeys = ReturnType<typeof createRemoteJWKSet>
