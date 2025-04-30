import type { Space } from './Space'

export interface SpacesResponse {
  total: number
  page: number
  pages: number
  results: Space[]
}
