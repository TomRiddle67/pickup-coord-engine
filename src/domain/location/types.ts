/**
 * A normalised score between 0 and 1 (inclusive).
 * 0 = no confidence. 1 = absolute confidence.
 * Used consistently across movement detection, landmark scoring,
 * and suggestion ranking.
 */
export type NormalisedScore = number

export type LocationSource =
  | 'GPS'
  | 'NETWORK'
  | 'PLATFORM'
  | 'SIMULATED'

export interface Location {
  latitude: number
  longitude: number
  timestamp: Date
  accuracyMetres: number
  source: LocationSource
  speedMetresPerSecond?: number
  headingDegrees?: number
}
