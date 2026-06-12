import { CandidateLandmark } from '../../domain/landmark/types'
import { PickupSuggestion } from '../../domain/suggestion/types'
import { DEFAULT_WEIGHTS, validateWeights, ScoringWeights } from './weights'
import { rankCandidates } from './scorer'

const DEFAULT_SEARCH_RADIUS_METRES = 300

export function generateSuggestions(
  tripId: string,
  candidates: CandidateLandmark[],
  driverEtaSeconds: number,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  searchRadiusMetres: number = DEFAULT_SEARCH_RADIUS_METRES
): PickupSuggestion[] {
  validateWeights(weights)

  if (candidates.length === 0) return []

  return rankCandidates(
    tripId,
    candidates,
    searchRadiusMetres,
    weights,
    driverEtaSeconds
  )
}