import { Location } from '@model/Location'
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

import { isUsableLocation } from '@/data/Location.logic'

export function isValidLocation(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidLocation',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Location) {
          // Nothing sent, or sent as null: both are legitimate and mean different things
          // one layer up -- "leave it alone" and "clear it". The resolvers tell those two
          // apart; what may not pass is a location that is not a place.
          //
          // ⛔ This used to read `Location2Point(value).type === 'Point'`, which can never
          // be false: that function writes `"type": "Point"` in both of its branches. So
          // the check passed everything -- an empty object, half a pair, a latitude of 999,
          // and text, which made JSON.parse throw in here and reach the member as a 500.
          if (value === null || value === undefined) {
            return true
          }
          return isUsableLocation(value)
        },
        defaultMessage(args: ValidationArguments) {
          return `${propertyName} must be a valid Location, ${args.property}`
        },
      },
    })
  }
}
