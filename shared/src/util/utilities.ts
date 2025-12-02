export const fullName = (firstName: string, lastName: string): string =>
  [firstName, lastName].filter(Boolean).join(' ')
