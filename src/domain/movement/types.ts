import { Location } from '../location/types'
import { NormalisedScore } from '../location/types'

export type MovementType = 'WALKING' | 'STATIC' | 'DRIVING' | 'UNKNOWN'

export interface MovementEvent {
  eventId: string
  tripId: string
  previousLocation: Location
  currentLocation: Location
  distanceMetres: number
  timeIntervalSeconds: number
  movementType: MovementType
  confidenceScore: NormalisedScore
  freshnessScore: NormalisedScore
  thresholdTriggered: boolean
  timestamp: Date
}