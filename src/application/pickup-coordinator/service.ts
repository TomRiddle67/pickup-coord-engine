import { TripRepository } from '../../infrastructure/repositories/trip-repository'
import { Trip } from '../../domain/trip/types'
import { Location } from '../../domain/location/types'
import { evaluateMovement } from '../../services/movement-detection'
import { discoverLandmarks } from '../../services/landmark-discovery'
import { generateSuggestions } from '../../services/scoring-engine'
import {
  HandleMovementEventInput,
  HandleMovementResult,
} from './types'

export class PickupCoordinatorService {
  constructor(private readonly tripRepository: TripRepository) {}

  async createTrip(input: {
    tripId: string
    riderId: string
    driverId: string
    originalPickupLocation: Location
  }): Promise<Trip> {
    const trip: Trip = {
      tripId: input.tripId,
      rider: { id: input.riderId },
      driver: { id: input.driverId },
      originalPickupLocation: input.originalPickupLocation,
      activePickupLocation: input.originalPickupLocation,
      state: 'TRIP_ACTIVE',
      movementEvents: [],
      suggestionSets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await this.tripRepository.save(trip)
    return trip
  }

  async getTrip(tripId: string): Promise<Trip | null> {
    return this.tripRepository.findById(tripId)
  }

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
      
      const MIN_FRESHNESS_TO_ACT = 0.3
      if (movementEvent.freshnessScore < MIN_FRESHNESS_TO_ACT) {
        await this.tripRepository.save(trip)
        return {
          outcome: 'NO_SUGGESTIONS',
          reason: 'Movement confirmed but observation is too stale to act on',
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

  async acceptSuggestion(
    tripId: string,
    suggestionId: string
  ): Promise<{ success: true; trip: Trip } | { success: false; error: string }> {
    const trip = await this.tripRepository.findById(tripId)

    if (!trip) {
      return { success: false, error: `Trip ${tripId} not found` }
    }

    const latestSet = trip.suggestionSets[trip.suggestionSets.length - 1]
    const suggestion = latestSet?.suggestions.find(
      s => s.suggestionId === suggestionId
    )

    if (!suggestion) {
      return { success: false, error: `Suggestion ${suggestionId} not found` }
    }

    trip.activePickupLocation = {
      latitude: suggestion.landmark.latitude,
      longitude: suggestion.landmark.longitude,
      timestamp: new Date(),
      accuracyMetres: 0,
      source: 'PLATFORM',
    }
    trip.activeSuggestionId = suggestionId
    trip.state = 'RIDER_RESPONSE'

    await this.tripRepository.save(trip)

    return { success: true, trip }
  }
}