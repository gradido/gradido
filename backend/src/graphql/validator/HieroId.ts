import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export function isValidHieroId(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidHieroId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          if (value.match(/[0-9]*\.[0-9]*\.[0-9]*/)) {
            return true
          }
          return false
        },
        defaultMessage(args: ValidationArguments) {
          return `${propertyName} must be a valid HieroId (0.0.2121), ${args.property}`
        },
      },
    })
  }
}
