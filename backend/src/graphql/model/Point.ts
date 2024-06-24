import { Position, Point as geojsonPoint } from 'geojson'

export class Point implements geojsonPoint {
  constructor() {
    this.coordinates = []
    this.type = 'Point'
  }

  type: 'Point'
  coordinates: Position
}
