export type LandmarkType =
  | 'GATE'
  | 'FUEL_STATION'
  | 'BUS_STOP'
  | 'MALL_ENTRANCE'
  | 'MARKET_ENTRANCE'
  | 'HOSPITAL_ENTRANCE'
  | 'SCHOOL_GATE'
  | 'OTHER'

export type TrafficRisk = 'LOW' | 'MEDIUM' | 'HIGH'

export type DataSource = 'OSM' | 'CURATED' | 'USER_GENERATED'

export interface Landmark {
  id: string
  name: string
  latitude: number
  longitude: number
  type: LandmarkType
  accessibilityScore: number
  visibilityScore: number
  trafficRisk: TrafficRisk
  legalStopSuitable: boolean
  isEntranceOrGate: boolean
  popularityScore: number
  dataSource: DataSource
  createdAt: Date
  updatedAt: Date
}
