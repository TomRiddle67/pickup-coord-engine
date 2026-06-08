import { Landmark } from '../landmark/types'
import { NormalisedScore } from '../location/types'

export type SuggestionStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'UNDELIVERED'

export interface PickupSuggestion {
  suggestionId: string
  tripId: string
  landmark: Landmark
  score: NormalisedScore
  rank: 1 | 2 | 3
  estimatedRiderWalkTimeSeconds: number
  estimatedDriverArrivalSeconds: number
  totalPickupTimeEstimate: number
  reason: string
  confidenceScore: NormalisedScore
  status: SuggestionStatus
  generatedAt: Date
  expiresAt: Date
}

export interface SuggestionSet {
  tripId: string
  suggestions: PickupSuggestion[]
  generatedAt: Date
  expiresAt: Date
  movementEventId: string
}
