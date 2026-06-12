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

    return landmarks
      .filter(landmark => landmark.name !== 'Unnamed Landmark')
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
    console.error('Landmark discovery failed, returning empty set:', error)
    return []
  }
}