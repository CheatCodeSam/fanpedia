import type { createRemoteJWKSet } from 'jose'

export type TokenClaim = 'access' | 'id'

export type CachedJwkKeys = ReturnType<typeof createRemoteJWKSet>

export interface Session {
	sub: string
	username: string
	accessToken: string
	refreshToken: string
}

export interface User {
	userVertex: number
	cognitoId: string
	username: string
}
