import { ValidationOptions, registerDecorator } from 'class-validator'

import { ContributionStatus } from 'database'

export function isContributionStatusArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isContributionStatusArray',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: ContributionStatus[]): boolean {
          const validValues = Object.values(ContributionStatus)
          return value.every((item) => validValues.includes(item))
        },
      },
    })
  }
}
