declare module '@ioc:Database/Gremlin' {
	import type { process } from 'gremlin'
	const g: process.GraphTraversalSource<process.GraphTraversal>
	export default g
}
