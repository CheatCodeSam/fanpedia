import Route from '@ioc:Adonis/Core/Route'
import g from '@ioc:Database/Gremlin'
import { process } from 'gremlin'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { Converter } from 'showdown'
import {
	DiffService,
	MergeService,
	S3WMergeService,
	TokenizerService,
} from 'App/Diff/Service'
import {
	LeftSideChanges,
	RightSideChanges,
	S3WMerge,
} from 'App/Diff/Service/S3WMergeService'

const MapToObject = (map: any): object => {
	const obj = {}
	for (const [key, value] of map) {
		if (value instanceof Map) {
			obj[key] = MapToObject(value)
		} else {
			obj[key] = value
		}
	}
	return obj
}

Route.group(() => {
	Route.get('page/create', async ({ user, subdomains, response, view }) => {
		const { wiki } = subdomains
		const doesWikiExist = await g.V().has('wiki', 'slug', wiki).hasNext()
		if (!doesWikiExist) return response.status(400).send('Wiki does not exists')
		if (!user) return response.redirect().toRoute('authentication.login')
		return view.render('Page/create')
	}).as('create')

	Route.post('page', async ({ request, user, response, subdomains }) => {
		const { wiki } = subdomains
		const doesWikiExist = await g.V().has('wiki', 'slug', wiki).hasNext()
		if (!doesWikiExist) return response.status(400).send('Wiki does not exists')
		if (!user) return response.redirect().toRoute('authentication.login')
		const pageSchema = schema.create({
			title: schema.string({ trim: true }, [rules.minLength(3)]),
			body: schema.string({ trim: true }),
			slug: schema.string({ trim: true }, [
				rules.regex(/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/),
			]),
		})
		const payload = await request.validate({ schema: pageSchema })
		const doesPageAlreadyExists = await g
			.V()
			.has('wiki', 'slug', wiki)
			.out()
			.has('page', 'slug', payload.slug)
			.hasNext()
		if (doesPageAlreadyExists)
			return response.status(400).send('Page already exists')
		const formattedBody = payload.body
			.replace(/\r\n/g, '\n')
			.replace(/\r/g, '\n')
		const now = new Date().toISOString()
		await g
			// Create a new vertex for the page as a
			.addV('page')
			.as('a')
			.property('title', payload.title)
			.property('slug', payload.slug)
			.property('date', now)
			// Get the user vertex as b
			.V(user.userVertex)
			.as('b')
			// user created this page
			.addE('created')
			.from_('b')
			.to('a')
			// page is a page of the wiki
			.addE('page_of')
			.from_('a')
			.to(process.statics.V().has('wiki', 'slug', wiki))
			// Create a new vertex for the page's initial revision
			.addV('revision')
			.as('c')
			.property('body', formattedBody)
			.property('date', now)
			.property('status', 'approved')
			.property('comment', 'Initial revision')
			// Create a 'main' edge to denote this is the current revision of the page
			.addE('main')
			.from_('a')
			.to('c')
			// revision is edit of page
			.addE('edit_of')
			.from_('c')
			.to('a')
			// user edited revision
			.addE('edited')
			.from_('b')
			.to('c')
			.next()
		return response.redirect().toPath(`/page/${payload.slug}`)
	}).as('store')

	Route.get(
		'page/:page',
		async ({ params, request, response, view, subdomains }) => {
			const { page } = params
			const { wiki } = subdomains
			const revision: string = request.qs().revision || ''

			const PS = process.statics
			const retval = await g
				.V()
				.has('wiki', 'slug', wiki)
				.in_('page_of')
				.has('page', 'slug', page)
				.project('pageInfo', 'Revision', 'main')
				.by(PS.elementMap('title', 'slug', 'date'))
				.by(
					PS.coalesce(
						PS.in_('edit_of')
							.hasId(revision)
							.elementMap('body', 'date', 'status'),
						PS.out('main').elementMap('body', 'date', 'status')
					)
				)
				.by(PS.out('main').elementMap('body', 'date', 'status'))
				.next()

			const project = retval.value
			const isMainRevision =
				revision === project.get('main').get(process.t.id).toString() ||
				revision === ''

			let rawBody: string = project.get('Revision').get('body')

			if (!isMainRevision) {
				const selectedRevision = revision as string
				const commonAncestor = await g
					.V(selectedRevision)
					.out('branched_from')
					.elementMap('body')
					.next()
				if (
					commonAncestor.value.get(process.t.id) !==
					project.get('main').get(process.t.id)
				) {
					const a = TokenizerService.tokenize(project.get('main').get('body'))
					const o = TokenizerService.tokenize(commonAncestor.value.get('body'))
					const b = TokenizerService.tokenize(
						project.get('Revision').get('body')
					)

					const isConflict = DiffService.threeWayDiff(a, o, b).some(
						(item) => item[0]?.tag === 'conflict'
					)

					if (isConflict)
						return response
							.redirect()
							.toPath(`/page/${page}/diff/${selectedRevision}`)

					rawBody = MergeService.threeWayMerge(a, o, b)
						.flatMap((item) => item.status === 'ok' && item.merge)
						.join('')
				}
			}

			const md = new Converter().makeHtml(rawBody)

			if (!retval.value) return response.status(404).send('Page not found.')

			return view.render('Page/show', {
				page: Object.fromEntries(project.get('pageInfo')),
				revision: Object.fromEntries(project.get('Revision')),
				body: md,
				isMainRevision: isMainRevision,
			})
		}
	).as('show')

	//Temporary route
	Route.get(
		'page/:page/diff/:diff',
		async ({ params, request, response, view, subdomains }) => {
			const { page, diff } = params as Record<string, string>
			const { wiki } = subdomains as Record<string, string>

			const PS = process.statics
			const values = await g
				.V(diff)
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

			// Selective Three Way Merge
			const M = S3WMergeService.selectiveThreeWayMerge(a, o, b)

			const renderDiff = (data: S3WMerge) => {
				// Define colors for different tags
				const colors = {
					conflict: 'lightcoral',
					replace: 'lightblue',
					insert: 'lightgreen',
					delete: 'yellow',
					equal: 'none',
				}

				// Function to create a single column
				const createColumn = (
					items: RightSideChanges[] | LeftSideChanges[]
				) => {
					return items
						.map(
							(item: RightSideChanges | LeftSideChanges) =>
								`<span style="background-color: ${colors[item.tag]};">${
									item.value
								}</span>`
						)
						.join('')
				}

				// Splitting data into left and right columns
				const leftColumn = createColumn(data.l)
				const rightColumn = createColumn(data.r)

				// Creating the final HTML with two columns
				return `
        <div style="display: flex;">
          <div style="flex: 1; padding: 10px;">${leftColumn}</div>
          <div style="flex: 1; padding: 10px;">${rightColumn}</div>
        </div>
      `
			}

			return renderDiff(M)
		}
	).as('diff')

	Route.get(
		'page/:page/edit',
		async ({ params, response, user, view, subdomains }) => {
			if (!user) return response.redirect().toRoute('authentication.login')
			const { page } = params
			const { wiki } = subdomains
			const wikiPage = await g
				.V()
				.has('wiki', 'slug', wiki)
				.in_('page_of')
				.has('page', 'slug', page)
				.project('pageInfo', 'mainRevision', 'previousEditor')
				.by(process.statics.elementMap('title', 'slug', 'date'))
				.by(process.statics.out('main').elementMap('body', 'date', 'status'))
				.by(process.statics.out('main').in_('edited').elementMap('username'))
				.next()
			if (!wikiPage) return response.status(400).send('Wiki does not exists')
			return view.render('Page/edit', {
				page: Object.fromEntries(wikiPage.value.get('pageInfo')),
				revision: Object.fromEntries(wikiPage.value.get('mainRevision')),
				previousEditor: Object.fromEntries(
					wikiPage.value.get('previousEditor')
				),
			})
		}
	).as('edit')

	Route.post(
		'page/:page',
		async ({ params, response, user, subdomains, request }) => {
			const { page } = params
			const { wiki } = subdomains
			//TODO What if wiki/page doesnt exist?
			if (!user) return response.status(400).send('no user')
			const editPageSchema = schema.create({
				body: schema.string({ trim: true }, []),
				comment: schema.string({ trim: true }, []),
				revision: schema.string({ trim: true }, []),
			})
			const payload = await request.validate({ schema: editPageSchema })
			const now = new Date().toISOString()
			const formattedBody = payload.body
				.replace(/\r\n/g, '\n')
				.replace(/\r/g, '\n')
			await g
				// create revision as a
				.addV('revision')
				.as('a')
				.property('date', now)
				.property('status', 'pending')
				.property('body', formattedBody)
				.property('comment', payload.comment)
				// get page vertex as b
				.V()
				.has('wiki', 'slug', wiki)
				.in_('page_of')
				.has('page', 'slug', page)
				.as('b')
				// Get the user vertex as c
				.V(user.userVertex)
				.as('c')
				// revision is edit of page
				.addE('edit_of')
				.from_('a')
				.to('b')
				// user edited revision
				.addE('edited')
				.from_('c')
				.to('a')
				.addE('branched_from')
				.from_('a')
				.to(process.statics.V(payload.revision))
				.next()

			return response.redirect().toPath(`/page/${page}`)
		}
	).as('update')

	Route.get(
		'page/:page/revisions',
		async ({ params, subdomains, response, user, view }) => {
			if (!user) return response.redirect().toRoute('authentication.login')
			const { page } = params
			const { wiki } = subdomains
			//TODO does page and wiki exist?

			const isModerator = await g
				.V(user.userVertex)
				.out('moderates')
				.has('wiki', 'slug', wiki)
				.hasNext()

			const PS = process.statics
			const x = await g
				.V()
				.has('wiki', 'slug', wiki)
				.in_('page_of')
				.has('page', 'slug', page)
				.in_('edit_of')
				.has('revision', 'status', 'pending')
				.project('revision', 'user', 'basedOn')
				.by(PS.elementMap())
				.by(PS.in_('edited').values('username'))
				.by(
					PS.project('revision', 'isMain')
						.by(PS.out('branched_from').elementMap('date', 'id'))
						.by(
							PS.coalesce(
								PS.out('branched_from').inE('main').constant(true),
								PS.constant(false)
							)
						)
				)
				.fold()
				.next()
			const retVal = x.value.map((p) => MapToObject(p))
			return view.render('Page/revisions', {
				revisions: retVal,
				isModerator: isModerator,
			})
		}
	).as('revisions')
})
	.as('page')
	.domain(':wiki.fanpedia-project.com')
	.middleware('authenticated')
