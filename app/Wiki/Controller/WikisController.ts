import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import g from '@ioc:Database/Gremlin'

export default class WikisController {
  public async index({}: HttpContextContract) {}

  public async create({ view, user, response }: HttpContextContract) {
    if (user) return view.render('Wiki/create')
    else return response.redirect().toRoute('authentication.login')
  }

  public async store({ request, response, user }: HttpContextContract) {
    const wikiSchema = schema.create({
      title: schema.string({ trim: true }, [rules.minLength(3)]),
      description: schema.string({ trim: true }, [rules.maxLength(155)]),
      slug: schema.string({ trim: true }, [rules.regex(/^(?!-)[A-Za-z0-9-]{1,63}(?<!-)$/)]),
    })

    const payload = await request.validate({ schema: wikiSchema })

    if (!user) return response.status(400).send('no user')

    const wikiVertex = await g
      .addV('wiki')
      .property('title', payload.title)
      .property('slug', payload.slug)
      .property('description', payload.description)
      .next()

    return payload
  }

  public async show({}: HttpContextContract) {}

  public async edit({}: HttpContextContract) {}

  public async update({}: HttpContextContract) {}

  public async destroy({}: HttpContextContract) {}
}
