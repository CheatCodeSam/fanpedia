import Env from '@ioc:Adonis/Core/Env'

export default {
  gremlin: {
    endpoint: Env.get('GREMLIN_ENDPOINT'),
  },
}
