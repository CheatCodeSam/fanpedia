import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { driver } from 'gremlin'

export default class GremlinProvider {
  constructor(protected app: ApplicationContract) {}

  private dc: driver.DriverRemoteConnection | null = null

  public async register() {
    const config = this.app.config.get('database.gremlin')
    const gremlin = await import('gremlin')
    this.app.container.singleton('Database/Gremlin', () => {
      this.dc = new gremlin.driver.DriverRemoteConnection(config.endpoint)
      const graph = new gremlin.structure.Graph()
      return graph.traversal().withRemote(this.dc)
    })
  }

  public async shutdown() {
    this.dc?.close()
  }
}
