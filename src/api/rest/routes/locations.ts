import { FastifyInstance } from 'fastify'
import { Location } from '../../../domain/location/types'

interface RawLocation {
  latitude: number
  longitude: number
  timestamp: string
  accuracyMetres: number
  source: Location['source']
  speedMetresPerSecond?: number
  headingDegrees?: number
}

function parseLocation(raw: RawLocation): Location {
  return {
    ...raw,
    timestamp: new Date(raw.timestamp),
  }
}

export async function locationRoutes(server: FastifyInstance): Promise<void> {
  server.post<{
    Params: { tripId: string }
    Body: {
      previousLocation: RawLocation
      currentLocation: RawLocation
      driverEtaSeconds: number
    }
  }>('/v1/trips/:tripId/locations', async (request, reply) => {
    const previousLocation = parseLocation(request.body.previousLocation)
    const currentLocation = parseLocation(request.body.currentLocation)

    const result = await server.coordinator.handleMovementEvent({
      tripId: request.params.tripId,
      previousLocation,
      currentLocation,
      driverEtaSeconds: request.body.driverEtaSeconds,
    })

    switch (result.outcome) {
      case 'SUGGESTIONS_GENERATED':
        return reply.send({
          success: true,
          requestId: request.id,
          timestamp: new Date().toISOString(),
          data: {
            outcome: result.outcome,
            suggestions: result.suggestions,
          },
        })

      case 'NO_MOVEMENT':
      case 'NO_SUGGESTIONS':
        return reply.send({
          success: true,
          requestId: request.id,
          timestamp: new Date().toISOString(),
          data: {
            outcome: result.outcome,
            reason: result.reason,
          },
        })

      case 'FAILED':
        return reply.code(500).send({
          success: false,
          requestId: request.id,
          timestamp: new Date().toISOString(),
          error: {
            code: 'COORDINATION_FAILED',
            message: result.error,
          },
        })
    }
  })
}