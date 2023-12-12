import type { ApplicationContract } from '@ioc:Adonis/Core/Application'
import type { HealthReportEntry } from '@ioc:Adonis/Core/HealthCheck'
import type { driver, process as p } from 'gremlin'

export default class GremlinProvider {
	constructor(protected app: ApplicationContract) {}

	private dc: driver.DriverRemoteConnection | null = null

	private async isHealthy(): Promise<HealthReportEntry> {
		const g = this.app.container.resolveBinding(
			'Database/Gremlin'
		) as p.GraphTraversalSource

		let healthy: boolean
		let code: string | undefined
		try {
			const count = await g.V().limit(1).count().next()
			healthy = count !== undefined
		} catch (error) {
			code = error.code
			healthy = false
		}
		return {
			displayName: 'Gremlin',
			health: {
				healthy: healthy,
				message: code,
			},
		}
	}

	public async register() {
		const config = this.app.config.get('database.gremlin')
		const gremlin = await import('gremlin')
		this.app.container.singleton('Database/Gremlin', () => {
			this.dc = new gremlin.driver.DriverRemoteConnection(config.endpoint)
			const graph = new gremlin.structure.Graph()
			return graph.traversal().withRemote(this.dc)
		})
	}

	public async boot() {
		const HealthCheck = this.app.container.use('Adonis/Core/HealthCheck')
		HealthCheck.addChecker('gremlin', async () => this.isHealthy())
	}

	public async shutdown() {
		this.dc?.close()
	}
}
