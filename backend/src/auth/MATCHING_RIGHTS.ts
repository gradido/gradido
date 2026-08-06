import { RIGHTS } from './RIGHTS'

// The rights that belong to the matching module, in ONE place. Two consumers must agree
// on this list and they cannot be allowed to drift apart: USER_RIGHTS grants them, and
// module/gate.ts withdraws them while the module is off. A right added to the first but
// not the second would be handed to every logged-in member with the module switched off,
// and nothing would fail.
export const MATCHING_RIGHTS = [
  RIGHTS.CREATE_MATCHING_ENTRY,
  RIGHTS.UPDATE_MATCHING_ENTRY,
  RIGHTS.DELETE_MATCHING_ENTRY,
  RIGHTS.LIST_MATCHING_ENTRY,
]
