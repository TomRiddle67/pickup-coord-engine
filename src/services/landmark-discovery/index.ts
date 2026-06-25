import { Landmark, CandidateLandmark } from '../../domain/landmark/types'
import { Location } from '../../domain/location/types'
import { fetchNearbyLandmarks } from '../../infrastructure/maps/overpass-client'
import { calculateDistance } from '../movement-detection/detector'

// TODO: Replace direct import with LandmarkProvider interface
// to decouple service from specific map provider implementation

const DEFAULT_SEARCH_RADIUS_METRES = 300
const MAX_CANDIDATES = 20

export async function discoverLandmarks(
  location: Location,
  radiusMetres: number = DEFAULT_SEARCH_RADIUS_METRES
): Promise<CandidateLandmark[]> {
  try {
  
    const landmarks = await fetchNearbyLandmarks(
      location.latitude,
      location.longitude,
      radiusMetres
    )

  const usable = landmarks.map(landmark => ({
  ...landmark,
  name: landmark.name === 'Unnamed Landmark'
    ? `${landmark.type.replace(/_/g, ' ')} (unnamed)`
    : landmark.name,
}))

console.log(`[landmark-discovery] ${usable.length} usable after fallback naming`)

    return usable
      .map(landmark => ({
        landmark,
        distanceMetres: calculateDistance(
          location,
          { ...location, latitude: landmark.latitude, longitude: landmark.longitude }
        )
      }))
      .sort((a, b) => a.distanceMetres - b.distanceMetres)
      .slice(0, MAX_CANDIDATES)

  } catch (error) {
    console.error('[landmark-discovery] Failed, returning empty set:', error)
    return []
  }
}