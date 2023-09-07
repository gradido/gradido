import { registerDecorator, ValidationOptions } from 'class-validator'

import { ContributionStatus } from '@enum/ContributionStatus'

export function isContributionStatusArray(validationOptions?: ValidationOptions) {
  // eslint-disable-next-line @typescript-eslint/ban-types
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
