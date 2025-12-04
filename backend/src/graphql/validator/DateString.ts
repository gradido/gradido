import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator'

export function isValidDateString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidDateString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string) {
          return new Date(value).toString() !== 'Invalid Date'
        },
        defaultMessage(args: ValidationArguments) {
          return `${propertyName} must be a valid date string, ${args.property}`
        },
      },
    })
  }
}
