import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'
import { process } from 'gremlin'
import Logger from '@ioc:Adonis/Core/Logger'
import { DiffService, MergeService, TokenizerService } from 'App/Diff/Service'
import { MergeStatus } from 'App/Diff/Service/MergeService'
import { schema } from '@ioc:Adonis/Core/Validator'

//TODO make these post requests
Route.group(() => {
	Route.get(':revision/approve', async ({ params, user, response }) => {
		// Does the revision exists? And is the user logged in?
		if (!user) return response.redirect('/login')
		const { revision } = params

		const revisionExists = await g.V(revision).hasNext()
		if (!revisionExists) return response.status(404)

		const PS = process.statics
		// Get a, o, and b
		const values = await g
			.V(revision)
			.project('revision', 'main', 'commonAncestor')
			.by(PS.elementMap('body', 'comment'))
			.by(PS.out('edit_of').out('main').elementMap('body'))
			.by(PS.out('branched_from').elementMap('body'))
			.next()

		const project = values.value
		if (
			project.get('main').get(process.t.id) ===
			project.get('commonAncestor').get(process.t.id)
		) {
			console.log('fast forward')

			// If a == o, then just move main to this revision.
			const retval = await g
				.V(revision)
				.property('status', 'approved')
				.as('approvedRevision')
				.out('edit_of')
				.as('page')
				.sideEffect(PS.outE('main').drop())
				.addE('main')
				.from_('page')
				.to('approvedRevision')
				.select('page')
				.project('page', 'revisionAuthor')
				.by(PS.id())
				.by(PS.select('approvedRevision').in_('edited').values('cognito_id'))
				.next()

			const val = retval.value

			Logger.info(
				`User ${user.cognitoId} approved Revision ${revision} by User ${val.get(
					'revisionAuthor'
				)} for Page ${val.get('page')}`
			)

			return 'success'
		}
		console.log('three way merge')

		// If main !== o, then this has to be a three way merge.
		const a = TokenizerService.tokenize(project.get('main').get('body'))
		const o = TokenizerService.tokenize(
			project.get('commonAncestor').get('body')
		)
		const b = TokenizerService.tokenize(project.get('revision').get('body'))
		const diffs = DiffService.threeWayDiff(a, o, b)
		// Conflicts need to be resolved somewhere else.
		for (const diff of diffs) {
			if (diff[0]?.tag === 'conflict')
				return response.redirect().toPath(`/revision/${revision}/resolve`)
		}
		const threeWaymerge = MergeService.threeWayMerge(a, o, b)
		const merge = threeWaymerge.map((m) => m.status === 'ok' && m.merge)

		const now = new Date().toISOString()

		const commitMessage = `Merge of ${project
			.get('main')
			.get(process.t.id)} and ${project
			.get('revision')
			.get(process.t.id)} - ${project.get('revision').get('comment')}`

		const retval = await g
			// Set initial revision to approved
			.V(revision)
			.property('status', 'approved')
			.as('mergedRevision')
			// // create revision as approved revision
			.addV('revision')
			.property('date', now)
			.property('status', 'approved')
			.property('body', merge)
			.property('comment', commitMessage)
			.as('newRevision')
			// // add branched from new rev to old rev
			.addE('branched_from')
			.from_('newRevision')
			.to('mergedRevision')
			// // add branch from new revision to old main
			.addE('branched_from')
			.from_('newRevision')
			.to(PS.V(project.get('main').get(process.t.id)))
			// // get page
			.V(revision)
			.out('edit_of')
			.as('page')
			// // drop main, and add main to approved revision
			.sideEffect(PS.outE('main').drop())
			.addE('main')
			.from_('page')
			.to('newRevision')
			// Add edit of
			.addE('edit_of')
			.from_('newRevision')
			.to('page')
			// // add edited from user to revision
			.addE('edited')
			.from_(process.statics.select('mergedRevision').in_('edited'))
			.to('newRevision')
			.next()

		const val = retval.value

		return 'success'
	}).as('approve')

	Route.get(':revision/reject', async ({ user, response, params }) => {
		if (!user) return response.redirect('/login')
		const { revision } = params

		const revisionExists = await g
			.V(revision)
			.has('status', 'pending')
			.hasNext()
		if (!revisionExists) return response.status(404)

		await g.V(revision).property('status', 'rejected').next()

		return 'sucess'
	}).as('reject')

	Route.get(':revision/resolve', async ({ user, response, params, view }) => {
		if (!user) return response.redirect('/login')
		const { revision } = params

		const PS = process.statics
		const values = await g
			.V(revision)
			.project('revision', 'main', 'commonAncestor')
			.by(PS.elementMap('body', 'comment'))
			.by(PS.out('edit_of').out('main').elementMap('body'))
			.by(PS.out('branched_from').elementMap('body'))
			.next()
		const project = values.value

		const a = TokenizerService.tokenize(project.get('main').get('body'))
		const o = TokenizerService.tokenize(
			project.get('commonAncestor').get('body')
		)
		const b = TokenizerService.tokenize(project.get('revision').get('body'))

		const merge = MergeService.threeWayMerge(a, o, b)

		const processMerges = (mergeData: MergeStatus[]): string[] => {
			const result: string[] = []
			mergeData.forEach((item) => {
				if (item.status === 'ok') {
					result.push(item.merge)
				} else if (item.status === 'conflict') {
					result.push('<<<<<<<')
					result.push(...item.a)
					result.push('=======')
					result.push(...item.b)
					result.push('>>>>>>>')
				}
			})

			return result
		}

		const mergeWithMarkers = processMerges(merge).join('')

		return view.render('Revision/resolve', {
			main: Object.fromEntries(project.get('main')),
			revision: Object.fromEntries(project.get('revision')),
			merge: mergeWithMarkers,
		})
	}).as('resolve')

	Route.post(':revision/resolve', async ({ request, response }) => {
		const editPageSchema = schema.create({
			body: schema.string({ trim: true }, []),
			revision: schema.string({ trim: true }, []),
		})
		const { body, revision } = await request.validate({
			schema: editPageSchema,
		})
		const now = new Date().toISOString()

		const commitMessage = 'resolved conflict'

		const PS = process.statics
		const values = await g
			.V(revision)
			.project('main')
			.by(PS.out('edit_of').out('main').elementMap('body'))
			.next()

		const mainId = values.value.get('main').get(process.t.id)

		console.log(mainId)

		const retval = await g
			// Set initial revision to approved
			.V(revision)
			.property('status', 'approved')
			.as('mergedRevision')
			// create revision as approved revision
			.addV('revision')
			.property('date', now)
			.property('status', 'approved')
			.property('body', body)
			.property('comment', commitMessage)
			.as('newRevision')
			// // add branched from new rev to old rev
			.addE('branched_from')
			.from_('newRevision')
			.to('mergedRevision')
			// // add branch from new revision to old main
			.addE('branched_from')
			.from_('newRevision')
			.to(PS.V(mainId))
			// // get page
			.V(revision)
			.out('edit_of')
			.as('page')
			// // drop main, and add main to approved revision
			.sideEffect(PS.outE('main').drop())
			.addE('main')
			.from_('page')
			.to('newRevision')
			// Add edit of
			.addE('edit_of')
			.from_('newRevision')
			.to('page')
			// // add edited from user to revision
			.addE('edited')
			.from_(PS.select('mergedRevision').in_('edited'))
			.to('newRevision')
			.next()

		return response.redirect().toPath('/')
	}).as('resolution')
})
	.as('revision')
	.prefix('revision')
	.domain(':wiki.fanpedia-project.com')
	.middleware('authenticated')
