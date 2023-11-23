import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { S3Client } from '@aws-sdk/client-s3'

export default class S3Provider {
  constructor(protected app: ApplicationContract) {}

  private client: S3Client | null = null

  public async register() {
    const clientS3 = await import('@aws-sdk/client-s3')
    const config = this.app.config.get('storage.s3')
    this.app.container.singleton('Storage/S3', () => {
      this.client = new clientS3.S3Client({ region: config.region })
      return this.client
    })
  }

  public async shutdown() {
    this.client?.destroy()
  }
}
