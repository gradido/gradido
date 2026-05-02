import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'
import { GradidoUnit } from 'shared'

export function IsPositiveGradidoUnit(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isPositiveGradidoUnit',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: GradidoUnit) {
          return value.gddCent > 0n
        },
        defaultMessage(args: ValidationArguments) {
          return `The ${propertyName} must be a positive value ${args.property}`
        },
      },
    })
  }
}
