declare module '@ioc:Authentication/Cognito' {
	import type { AuthenticationService as service } from 'App/Authentication/Service'
	const AuthenticationService: service
	export default AuthenticationService
}
