import { PickupCoordinatorService } from '../application/pickup-coordinator/service'

declare module 'fastify' {
  interface FastifyInstance {
    coordinator: PickupCoordinatorService
  }
}