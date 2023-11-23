import Env from '@ioc:Adonis/Core/Env'

export default {
  s3: {
    region: Env.get('S3_REGION'),
  },
}
