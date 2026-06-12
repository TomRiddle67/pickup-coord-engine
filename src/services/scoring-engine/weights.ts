export interface ScoringWeights {
  proximity: number
  accessibility: number
  visibility: number
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  proximity:     0.40,
  accessibility: 0.35,
  visibility:    0.25,
}

export function validateWeights(weights: ScoringWeights): void {
  const total = weights.proximity + weights.accessibility + weights.visibility
  const tolerance = 0.001
  if (Math.abs(total - 1.0) > tolerance) {
    throw new Error(
      `Scoring weights must sum to 1.0. Got ${total.toFixed(3)}`
    )
  }
}