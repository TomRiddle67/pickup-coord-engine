import { Trip } from '../../domain/trip/types'

export interface TripRepository {
  findById(tripId: string): Promise<Trip | null>
  save(trip: Trip): Promise<void>
}