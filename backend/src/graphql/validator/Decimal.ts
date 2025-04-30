import {
  type ValidationArguments,
  type ValidationOptions,
  registerDecorator,
} from 'class-validator'
import type { Decimal } from 'decimal.js-light'

export function IsPositiveDecimal(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPositiveDecimal',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Decimal) {
          return value.greaterThan(0)
        },
        defaultMessage(args: ValidationArguments) {
          return `The ${propertyName} must be a positive value ${args.property}`
        },
      },
    })
  }
}
