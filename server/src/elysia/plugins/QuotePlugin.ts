import type { Client } from 'discord.js'
import { Elysia, t } from 'elysia'
import log4js from 'log4js'
import { ObjectId } from 'mongodb'
import { getUserById } from '../../discord/Client'
import type { Quote } from '../../prisma/gen/prisma/client'
import { databaseDecorator, discordClientDecorator } from '../Setup'

const mapToClientQuote = async (quote: Quote, discordClient: Client) => {
	return {
		_id: quote.id,
		content: quote.content,
		timestamp: quote.timestamp,
		creator: await getUserById(discordClient, quote.creator),
		participants: await Promise.all(
			quote.participants.map(async (participant) => await getUserById(discordClient, participant))
		),
		votes: quote.votes
	}
}

const quotePlugin = new Elysia({ name: 'Quote' })
	.use(databaseDecorator)
	.use(discordClientDecorator)
	.decorate('logger', log4js.getLogger('QuotePlugin'))
	.group('/quote', (app) =>
		app
			.get('', async ({ prisma, discordClient }) => {
				const quotes = await prisma.quote.findMany({ orderBy: { timestamp: 'desc' } })

				return Promise.all(quotes.map(async (quote) => mapToClientQuote(quote, discordClient)))
			})
			.get('/random', async ({ set, prisma, discordClient }) => {
				const raw = (
					await prisma.quote.aggregateRaw({
						pipeline: [{ $sample: { size: 1 } }]
						// biome-ignore lint/suspicious/noExplicitAny:
					})
				)[0] as unknown as Quote & { _id: { $oid: string } }

				if (!raw) {
					set.status = 404
					return
				}

				const {
					id,
					_id: { $oid },
					creator,
					participants,
					...rest
				} = raw

				// Prisma `aggregateRaw` bypasses `@map()` operations in the defined schema.
				// This means that `_id` is never mapped to `id`.
				return {
					id: $oid.toString(),
					creator: await getUserById(discordClient, creator),
					participants: Promise.all(
						participants.map(async (participant) => await getUserById(discordClient, participant))
					),
					...rest
				}
			})
			.get('/:id', async ({ set, prisma, discordClient, params: { id } }) => {
				if (!ObjectId.isValid(id)) {
					set.status = 400
					return
				}
				const quote = await prisma.quote.findUnique({
					where: {
						id: id
					}
				})

				if (!quote) {
					set.status = 404
					return
				}

				return mapToClientQuote(quote, discordClient)
			})
			.get(
				'/creator/:id',
				async ({ prisma, discordClient, params: { id } }) => {
					const quotes = await prisma.quote.findMany({
						where: {
							creator: id
						}
					})

					return Promise.all(quotes.map(async (quote) => mapToClientQuote(quote, discordClient)))
				},
				{
					params: t.Object({
						id: t.String()
					})
				}
			)
	)

export { quotePlugin }
