import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { driver, structure } from 'gremlin'

export default class GremlinProvider {
  constructor(protected app: ApplicationContract) {}

  private dc: driver.DriverRemoteConnection | null = null

  public register() {
    this.app.container.singleton('Database/Gremlin', () => {
      const config = this.app.config.get('database.gremlin')
      const gremlin = require('gremlin')
      const DriverRemoteConnection: typeof driver.DriverRemoteConnection =
        gremlin.driver.DriverRemoteConnection
      const Graph: typeof structure.Graph = gremlin.structure.Graph

      this.dc = new DriverRemoteConnection(config.endpoint)
      const graph = new Graph()
      return graph.traversal().withRemote(this.dc)
    })
  }

  public async shutdown() {
    this.dc?.close()
  }
}
