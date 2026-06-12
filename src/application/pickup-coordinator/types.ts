import { Location } from '../../domain/location/types'
import { PickupSuggestion } from '../../domain/suggestion/types'

export interface HandleMovementEventInput {
  tripId: string
  previousLocation: Location
  currentLocation: Location
  driverEtaSeconds: number
}

export type HandleMovementResult =
  | {
      outcome: 'SUGGESTIONS_GENERATED'
      suggestions: PickupSuggestion[]
    }
  | {
      outcome: 'NO_MOVEMENT'
      reason: string
    }
  | {
      outcome: 'NO_SUGGESTIONS'
      reason: string
    }
  | {
      outcome: 'FAILED'
      error: string
    }