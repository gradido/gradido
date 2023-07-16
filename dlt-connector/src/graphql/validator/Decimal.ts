import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'
import { Decimal } from 'decimal.js-light'

export function IsPositiveDecimal(validationOptions?: ValidationOptions) {
  return function (object: NonNullable<unknown>, propertyName: string) {
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
          return `${args.property} must be a positive decimal`
        },
      },
    })
  }
}
