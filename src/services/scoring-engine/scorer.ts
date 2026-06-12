import { randomUUID } from 'crypto'
import { CandidateLandmark } from '../../domain/landmark/types'
import { PickupSuggestion } from '../../domain/suggestion/types'
import { ScoringWeights } from './weights'

const REASON_TEMPLATES: Record<string, string> = {
  FUEL_STATION:      'Fuel stations offer clear roadside access and easy visibility',
  GATE:              'Gates provide a defined meeting point with vehicle access',
  MALL_ENTRANCE:     'Mall entrances have designated drop-off areas',
  BUS_STOP:          'Bus stops are visible and accessible from the road',
  HOSPITAL_ENTRANCE: 'Hospital entrances have clear vehicle access lanes',
  SCHOOL_GATE:       'School gates are clearly marked and visible',
  MARKET_ENTRANCE:   'Market entrance — confirm access with driver',
  OTHER:             'Accessible location near your position',
}

// TODO: Replace linear proximity decay with exponential curve
// Linear is acceptable for MVP but underweights short-distance differences
function normaliseProximity(
  distanceMetres: number,
  searchRadiusMetres: number
): number {
  return Math.max(0, 1 - distanceMetres / searchRadiusMetres)
}

function scoreCandidate(
  candidate: CandidateLandmark,
  searchRadiusMetres: number,
  weights: ScoringWeights
): number {
  const proximityScore = normaliseProximity(
    candidate.distanceMetres,
    searchRadiusMetres
  )

  return (
    proximityScore                         * weights.proximity +
    candidate.landmark.accessibilityScore  * weights.accessibility +
    candidate.landmark.visibilityScore     * weights.visibility
  )
}

export function rankCandidates(
  tripId: string,
  candidates: CandidateLandmark[],
  searchRadiusMetres: number,
  weights: ScoringWeights,
  driverEtaSeconds: number
): PickupSuggestion[] {
  const eligible = candidates.filter(
    c => c.landmark.legalStopSuitable
  )

  // TODO: Return explicit NO_ELIGIBLE_LANDMARKS reason code
  // rather than empty array when all candidates are filtered
  if (eligible.length === 0) return []

  const scored = eligible.map(candidate => ({
    candidate,
    score: scoreCandidate(candidate, searchRadiusMetres, weights),
  }))

  scored.sort((a, b) => b.score - a.score)

  const top3 = scored.slice(0, 3)

  return top3.map((entry, index) => {
    const { candidate, score } = entry
    const { landmark } = candidate

    const walkSpeedMetresPerSecond = 1.4
    const estimatedRiderWalkTimeSeconds = Math.round(
      candidate.distanceMetres / walkSpeedMetresPerSecond
    )

    return {
      suggestionId:                  randomUUID(),
      tripId,
      landmark,
      score,
      rank:                          (index + 1) as 1 | 2 | 3,
      estimatedRiderWalkTimeSeconds,
      estimatedDriverArrivalSeconds: driverEtaSeconds,
      totalPickupTimeEstimate:       Math.max(
                                       estimatedRiderWalkTimeSeconds,
                                       driverEtaSeconds
                                     ),
      reason: REASON_TEMPLATES[landmark.type] ?? REASON_TEMPLATES['OTHER'],
      // TODO: Replace with real confidence model based on score separation,
      // candidate count, GPS accuracy, and movement confidence
      confidenceScore:               0.7,
      status:                        'PENDING',
      generatedAt:                   new Date(),
      expiresAt:                     new Date(Date.now() + 60_000),
    }
  })
}