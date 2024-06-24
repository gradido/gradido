import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'
import { Point } from '@/graphql/model/Point'

export function isValidPoint(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidPoint',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: Point) {
          if (value.type === 'Point') {
            if (value.coordinates.length === 2) {
              return value.coordinates.every((coord) => typeof coord === 'number')
            }
          }
          return false
        },
        defaultMessage(args: ValidationArguments) {
          return `${propertyName} must be a valid Point in geoJSON Format, ${args.property}`
        },
      },
    })
  }
}
