import { TripRepository } from '../../infrastructure/repositories/trip-repository'
import { evaluateMovement } from '../../services/movement-detection'
import { discoverLandmarks } from '../../services/landmark-discovery'
import { generateSuggestions } from '../../services/scoring-engine'
import {
  HandleMovementEventInput,
  HandleMovementResult,
} from './types'

export class PickupCoordinatorService {
  constructor(private readonly tripRepository: TripRepository) {}

  async handleMovementEvent(
    input: HandleMovementEventInput
  ): Promise<HandleMovementResult> {
    try {
      const trip = await this.tripRepository.findById(input.tripId)

      if (!trip) {
        return {
          outcome: 'FAILED',
          error: `Trip not found: ${input.tripId}`,
        }
      }

      const movementEvent = evaluateMovement(
        input.tripId,
        input.previousLocation,
        input.currentLocation
      )

      if (!movementEvent) {
        return {
          outcome: 'NO_MOVEMENT',
          reason: 'Location sample did not constitute meaningful movement',
        }
      }

      trip.movementEvents.push(movementEvent)

      if (!movementEvent.thresholdTriggered) {
        await this.tripRepository.save(trip)
        return {
          outcome: 'NO_MOVEMENT',
          reason: 'Movement detected but threshold not exceeded',
        }
      }

      const candidates = await discoverLandmarks(input.currentLocation)

      if (candidates.length === 0) {
        trip.state = 'MOVEMENT_DETECTED'
        await this.tripRepository.save(trip)
        return {
          outcome: 'NO_SUGGESTIONS',
          reason: 'No suitable landmarks found near current position',
        }
      }

      const suggestions = generateSuggestions(
        input.tripId,
        candidates,
        input.driverEtaSeconds
      )

      if (suggestions.length === 0) {
        trip.state = 'MOVEMENT_DETECTED'
        await this.tripRepository.save(trip)
        return {
          outcome: 'NO_SUGGESTIONS',
          reason: 'Landmarks found but none passed scoring filters',
        }
      }

      trip.state = 'SUGGESTIONS_GENERATED'
      trip.suggestionSets.push({
        tripId: input.tripId,
        suggestions,
        generatedAt: new Date(),
        expiresAt: suggestions[0].expiresAt,
        movementEventId: movementEvent.eventId,
      })

      await this.tripRepository.save(trip)

      return {
        outcome: 'SUGGESTIONS_GENERATED',
        suggestions,
      }

    } catch (error) {
      return {
        outcome: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}