import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'
import { Decimal } from 'decimal.js-light'

export function IsPositiveDecimal(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPositiveDecimal',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Decimal): boolean {
          return value.greaterThan(0)
        },
        defaultMessage(args: ValidationArguments): string {
          return `The ${propertyName} must be a positive value ${args.property}`
        },
      },
    })
  }
}
