declare module '@ioc:Authentication/Cognito' {
  import type service from 'App/Authentication/Service'
  const AuthenticationService: service
  export default AuthenticationService
}
