import { Decimal } from 'decimal.js-light'

export class GmsUserProfile {
  firstName: string
  lastName: string
  alias: string
  type: number
  name: string
  location: {
    type: string
    coordinates: [Decimal, Decimal]
  }

  accuracy: unknown
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  language: string
  profileImage: unknown
}
