import { FastifyInstance } from 'fastify'
import { Location } from '../../../domain/location/types'

export async function tripRoutes(server: FastifyInstance): Promise<void> {
  server.post<{
    Body: {
      tripId: string
      riderId: string
      driverId: string
      originalPickupLocation: Location
    }
  }>('/v1/trips', async (request, reply) => {
    const trip = await server.coordinator.createTrip(request.body)

    return reply.code(201).send({
      success: true,
      requestId: request.id,
      timestamp: new Date().toISOString(),
      data: { tripId: trip.tripId, state: trip.state },
    })
  })

  server.get<{
    Params: { tripId: string }
  }>('/v1/trips/:tripId', async (request, reply) => {
    const trip = await server.coordinator.getTrip(request.params.tripId)

    if (!trip) {
      return reply.code(404).send({
        success: false,
        requestId: request.id,
        timestamp: new Date().toISOString(),
        error: {
          code: 'TRIP_NOT_FOUND',
          message: `Trip ${request.params.tripId} not found`,
        },
      })
    }

    return reply.send({
      success: true,
      requestId: request.id,
      timestamp: new Date().toISOString(),
      data: { tripId: trip.tripId, state: trip.state },
    })
  })
}