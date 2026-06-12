import { randomUUID } from 'crypto'
import { Location } from '../../domain/location/types'
import { MovementEvent } from '../../domain/movement/types'
import { isLocationTrusted, isLikelyDrift } from './filters'


const MOVEMENT_THRESHOLD_METRES = 50
const MIN_CONFIDENCE_TO_TRIGGER = 0.6

export function calculateDistance(a: Location, b: Location): number {
  const R = 6371000
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const deltaLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const deltaLng = ((b.longitude - a.longitude) * Math.PI) / 180

  const x =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

export function calculateConfidence(
  previous: Location,
  current: Location,
  distanceMetres: number
): number {
  const accuracyFactor =
    1 - Math.min(current.accuracyMetres / 100, 1)

  const timeDeltaSeconds =
    (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000
  const timeFactor = timeDeltaSeconds > 0 && timeDeltaSeconds < 30 ? 1 : 0.5

  const speedFactor =
    current.speedMetresPerSecond !== undefined &&
    current.speedMetresPerSecond > 0.3
      ? 1
      : 0.7

  return Math.min(accuracyFactor * timeFactor * speedFactor, 1)
}

export function evaluateMovement(
  tripId: string,
  previous: Location,
  current: Location
): MovementEvent | null {
  if (!isLocationTrusted(current)) return null

  const distanceMetres = calculateDistance(previous, current)

  if (isLikelyDrift(previous, current, distanceMetres)) return null

  const confidenceScore = calculateConfidence(previous, current, distanceMetres)

  if (confidenceScore < MIN_CONFIDENCE_TO_TRIGGER) return null

  const timeIntervalSeconds =
    (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000

  const speedMetresPerSecond =
    timeIntervalSeconds > 0 ? distanceMetres / timeIntervalSeconds : 0

  const movementType =
  speedMetresPerSecond < 0.5 ? 'STATIC'
  : speedMetresPerSecond < 3 ? 'WALKING'
  : speedMetresPerSecond < 15 ? 'DRIVING'
  : 'UNKNOWN'

  const thresholdTriggered = distanceMetres >= MOVEMENT_THRESHOLD_METRES

  return {
    eventId: randomUUID(),
    tripId,
    previousLocation: previous,
    currentLocation: current,
    distanceMetres,
    timeIntervalSeconds,
    movementType,
    confidenceScore,
    thresholdTriggered,
    timestamp: new Date()
  }
}