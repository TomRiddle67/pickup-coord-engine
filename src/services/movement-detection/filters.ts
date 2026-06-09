import { Location } from '../../domain/location/types'

const MAX_ACCEPTABLE_ACCURACY_METRES = 25
const MIN_SPEED_FOR_MOVEMENT_METRES_PER_SECOND = 0.3

export function isLocationTrusted(location: Location): boolean {
  if (location.accuracyMetres > MAX_ACCEPTABLE_ACCURACY_METRES) {
    return false
  }
  return true
}

export function isLikelyDrift(
  previous: Location,
  current: Location,
  distanceMetres: number
): boolean {
  const timeDeltaSeconds =
    (current.timestamp.getTime() - previous.timestamp.getTime()) / 1000

  if (timeDeltaSeconds <= 0) return true

  const impliedSpeedMetresPerSecond = distanceMetres / timeDeltaSeconds

  const reportedSpeedIsNearZero =
    current.speedMetresPerSecond !== undefined &&
    current.speedMetresPerSecond < MIN_SPEED_FOR_MOVEMENT_METRES_PER_SECOND

  const movementIsPhysicallyUnrealistic =
    impliedSpeedMetresPerSecond > 30

  if (reportedSpeedIsNearZero && distanceMetres > 0) return true
  if (movementIsPhysicallyUnrealistic) return true

  return false
}
