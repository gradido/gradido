import { Location } from '@model/Location'
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

import { Location2Point } from '@/graphql/resolver/util/Location2Point'

export function isValidLocation(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidLocation',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Location) {
          // console.log('isValidLocation:', value, value.getPoint())
          if (!value || Location2Point(value).type === 'Point') {
            return true
          }
          return false
        },
        defaultMessage(args: ValidationArguments) {
          return `${propertyName} must be a valid Location, ${args.property}`
        },
      },
    })
  }
}
