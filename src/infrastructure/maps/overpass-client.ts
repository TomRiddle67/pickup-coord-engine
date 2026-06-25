import { Landmark, LandmarkType, TrafficRisk} from '../../domain/landmark/types'

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter'

const OSM_TAG_TO_LANDMARK_TYPE: Record<string, LandmarkType> = {
  'amenity=fuel':          'FUEL_STATION',
  'amenity=bus_station':   'BUS_STOP',
  'highway=bus_stop':      'BUS_STOP',
  'shop=mall':             'MALL_ENTRANCE',
  'amenity=marketplace':   'MARKET_ENTRANCE',
  'amenity=hospital':      'HOSPITAL_ENTRANCE',
  'barrier=gate':          'GATE',
  'entrance=main':         'GATE',
}

function buildOverpassQuery(
  latitude: number,
  longitude: number,
  radiusMetres: number
): string {
  return `
    [out:json][timeout:10];
    (
      node["amenity"="fuel"](around:${radiusMetres},${latitude},${longitude});
      node["amenity"="bus_station"](around:${radiusMetres},${latitude},${longitude});
      node["highway"="bus_stop"](around:${radiusMetres},${latitude},${longitude});
      node["shop"="mall"](around:${radiusMetres},${latitude},${longitude});
      node["amenity"="marketplace"](around:${radiusMetres},${latitude},${longitude});
      node["barrier"="gate"](around:${radiusMetres},${latitude},${longitude});
      node["amenity"="hospital"](around:${radiusMetres},${latitude},${longitude});
    );
    out body;
  `
}

function resolveLandmarkType(tags: Record<string, string>): LandmarkType {
  for (const [key, type] of Object.entries(OSM_TAG_TO_LANDMARK_TYPE)) {
    const [tagKey, tagValue] = key.split('=')
    if (tags[tagKey] === tagValue) return type as LandmarkType
  }
  return 'OTHER'
}

const DEFAULT_ACCESSIBILITY_BY_TYPE: Record<LandmarkType, number> = {
  GATE:               0.8,
  FUEL_STATION:       0.9,
  BUS_STOP:           0.6,
  MALL_ENTRANCE:      0.8,
  MARKET_ENTRANCE:    0.3,
  HOSPITAL_ENTRANCE:  0.7,
  SCHOOL_GATE:        0.7,
  OTHER:              0.5,
}

const DEFAULT_VISIBILITY_BY_TYPE: Record<LandmarkType, number> = {
  GATE:               0.8,
  FUEL_STATION:       0.9,
  BUS_STOP:           0.7,
  MALL_ENTRANCE:      0.85,
  MARKET_ENTRANCE:    0.6,
  HOSPITAL_ENTRANCE:  0.8,
  SCHOOL_GATE:        0.75,
  OTHER:              0.5,
}

const DEFAULT_TRAFFIC_RISK_BY_TYPE: Record<LandmarkType, TrafficRisk> = {
  GATE:               'LOW',
  FUEL_STATION:       'LOW',
  BUS_STOP:           'MEDIUM',
  MALL_ENTRANCE:      'MEDIUM',
  MARKET_ENTRANCE:    'HIGH',
  HOSPITAL_ENTRANCE:  'LOW',
  SCHOOL_GATE:        'MEDIUM',
  OTHER:              'MEDIUM',
}

function mapOsmNodeToLandmark(node: {
  id: number
  lat: number
  lon: number
  tags?: Record<string, string>
}): Landmark {
  const tags = node.tags ?? {}
  const type = resolveLandmarkType(tags)

  return {
    id:                `osm-${node.id}`,
    name:              tags['name'] ?? tags['ref'] ?? 'Unnamed Landmark',
    latitude:          node.lat,
    longitude:         node.lon,
    type,
    accessibilityScore:  DEFAULT_ACCESSIBILITY_BY_TYPE[type],
    visibilityScore:     DEFAULT_VISIBILITY_BY_TYPE[type],
    trafficRisk:         DEFAULT_TRAFFIC_RISK_BY_TYPE[type],
    legalStopSuitable:   type !== 'MARKET_ENTRANCE',
    isEntranceOrGate:    type === 'GATE',
    popularityScore:     0,
    dataSource:          'OSM',
    createdAt:           new Date(),
    updatedAt:           new Date(),
  }
}

export async function fetchNearbyLandmarks(
  latitude: number,
  longitude: number,
  radiusMetres: number
): Promise<Landmark[]> {
  const query = buildOverpassQuery(latitude, longitude, radiusMetres)

 const response = await fetch(OVERPASS_API_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'User-Agent': 'pickup-coord-engine/0.1.0 (open-source coordination engine)',
  },
  body: `data=${encodeURIComponent(query)}`,
})

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`)
  }

  const data = await response.json() as { elements: {
    id: number
    lat: number
    lon: number
    tags?: Record<string, string>
  }[] }

  return data.elements.map(mapOsmNodeToLandmark)
}