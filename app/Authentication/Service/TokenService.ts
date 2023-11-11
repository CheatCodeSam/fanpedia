import config from 'Config/cognito'
import axios from 'axios'

export default class TokenService {
  public static async getToken(code: string) {
    const tokenUrl = `https://${config.domain}.auth.${config.region}.amazoncognito.com/oauth2/token`
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('client_id', config.client_id)
    params.append('client_secret', config.client_secret)
    params.append('redirect_uri', config.callback_url)
    params.append('code', code)
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data
  }

  public static async getAccessTokenWithRefreshToken(refreshToken: string) {
    const tokenUrl = `https://${config.domain}.auth.${config.region}.amazoncognito.com/oauth2/token`
    const params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('client_id', config.client_id)
    params.append('refresh_token', refreshToken)
    params.append('client_secret', config.client_secret)
    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    return response.data.access_token as string
  }
}
