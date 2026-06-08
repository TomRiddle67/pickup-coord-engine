import { SuggestionSet } from '../suggestion/types'
import { MovementEvent } from '../movement/types'
import { Location } from '../location/types'

export type TripState =
  | 'TRIP_ACTIVE'
  | 'MOVEMENT_DETECTED'
  | 'SUGGESTIONS_GENERATED'
  | 'RIDER_RESPONSE'
  | 'DRIVER_RESPONSE'
  | 'COORDINATION_ACTIVE'
  | 'PICKUP_SUCCESS'
  | 'SUGGESTION_EXPIRED'
  | 'DRIVER_DECLINED'
  | 'TRIP_CANCELLED'

export type RiderResponse = 'ACCEPTED' | 'REJECTED' | 'IGNORED'
export type DriverResponse = 'ACCEPTED' | 'DECLINED'

export interface Participant {
  id: string
  currentLocation?: Location
}

export interface Trip {
  tripId: string
  rider: Participant
  driver: Participant
  originalPickupLocation: Location
  activePickupLocation: Location
  state: TripState
  movementEvents: MovementEvent[]
  suggestionSets: SuggestionSet[]
  activeSuggestionId?: string
  createdAt: Date
  updatedAt: Date
}
