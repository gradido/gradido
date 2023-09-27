import { registerDecorator, ValidationOptions } from 'class-validator'

export function isValidDateString(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidDateString',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string): boolean {
          return !isNaN(Date.parse(value))
        },
        defaultMessage(): string {
          return `${propertyName} must be a valid date string`
        },
      },
    })
  }
}
