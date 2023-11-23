declare module '@ioc:Storage/S3' {
  import type { S3Client } from '@aws-sdk/client-s3'
  const client: S3Client
  export default client
}
