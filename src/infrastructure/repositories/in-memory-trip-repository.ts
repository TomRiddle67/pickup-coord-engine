import { Trip } from '../../domain/trip/types'
import { TripRepository } from './trip-repository'

export class InMemoryTripRepository implements TripRepository {
  private readonly trips = new Map<string, Trip>()

  async findById(tripId: string): Promise<Trip | null> {
    return this.trips.get(tripId) ?? null
  }

  async save(trip: Trip): Promise<void> {
    this.trips.set(trip.tripId, structuredClone(trip))
  }
}