import { FastifyInstance } from 'fastify'

export async function suggestionRoutes(server: FastifyInstance): Promise<void> {
  server.post<{
    Params: { tripId: string; suggestionId: string }
  }>('/v1/trips/:tripId/suggestions/:suggestionId/accept',
    async (request, reply) => {
      const { tripId, suggestionId } = request.params

      const result = await server.coordinator.acceptSuggestion(
        tripId,
        suggestionId
      )

      if (!result.success) {
        return reply.code(404).send({
          success: false,
          requestId: request.id,
          timestamp: new Date().toISOString(),
          error: {
            code: 'ACCEPT_SUGGESTION_FAILED',
            message: result.error,
          },
        })
      }

      return reply.send({
        success: true,
        requestId: request.id,
        timestamp: new Date().toISOString(),
        data: {
          tripId: result.trip.tripId,
          state: result.trip.state,
          activePickupLocation: result.trip.activePickupLocation,
        },
      })
    }
  )
}