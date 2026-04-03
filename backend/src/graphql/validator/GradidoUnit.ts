import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { GradidoUnit } from 'shared-native'

export function IsPositiveGradidoUnit(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPositiveGradidoUnit',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: GradidoUnit) {
          return value.greaterThan(new GradidoUnit(0))
        },
        defaultMessage(args: ValidationArguments) {
          return `The ${propertyName} must be a positive value ${args.property}`
        },
      },
    })
  }
}
