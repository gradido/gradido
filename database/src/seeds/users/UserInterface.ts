export interface UserInterface {
  // Every member holds a name (migration 0164 refuses a local row without one), so a seed
  // brings its own; the random users of the seeding loop derive theirs from the generated
  // name the way registration does (backend/src/seeds/index.ts).
  alias: string
  // Drawn by the seeding loop where the alias is built from it - the last rung of the ladder
  // is the gradido id, as in RegisterUserRole.getFreeAlias; the factory draws one itself
  // otherwise.
  gradidoId?: string
  email?: string
  firstName?: string
  lastName?: string
  // description?: string
  createdAt?: Date
  emailChecked?: boolean
  language?: string
  deletedAt?: Date
  publisherId?: number
  role?: string
}
