// not compatible with typescript 4
// import { enum as zEnum } from 'zod/v4-mini'
export enum OptInType {
  EMAIL_OPT_IN_REGISTER = 1,
  EMAIL_OPT_IN_RESET_PASSWORD = 2,
  // A second contact row waiting for the member to confirm a NEW address. Mirrored in
  // `backend/src/graphql/enum/OptInType.ts`; a test holds the two together.
  EMAIL_OPT_IN_CHANGE = 3,
}

// export const OptInTypeSchema = zEnum(OptInType)
