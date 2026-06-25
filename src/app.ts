import Fastify from 'fastify'
import { InMemoryTripRepository } from './infrastructure/repositories/in-memory-trip-repository'
import { PickupCoordinatorService } from './application/pickup-coordinator/service'
import { tripRoutes } from './api/rest/routes/trips'
import { locationRoutes } from './api/rest/routes/locations'
import { suggestionRoutes } from './api/rest/routes/suggestions'

const server = Fastify({ logger: true })

const tripRepository = new InMemoryTripRepository()
const coordinator = new PickupCoordinatorService(tripRepository)

server.decorate('coordinator', coordinator)

server.get('/health', async () => {
  return { status: 'ok', service: 'pickup-coord-engine' }
})

server.register(tripRoutes)
server.register(locationRoutes)
server.register(suggestionRoutes)

const start = async (): Promise<void> => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()