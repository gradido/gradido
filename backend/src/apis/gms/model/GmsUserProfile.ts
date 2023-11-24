import { Decimal } from 'decimal.js-light'

export class GmsUserProfile {
  firstName: string | undefined
  lastName: string | undefined
  alias: string
  type: number
  name: string | undefined
  location: {
    type: string
    coordinates: [Decimal, Decimal]
  }

  accuracy: unknown
  address: string | undefined
  city: string | undefined
  state: string
  country: string | undefined
  zipCode: string | undefined
  language: string
  profileImage: unknown
}
