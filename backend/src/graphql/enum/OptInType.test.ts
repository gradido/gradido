// AI-GENERATED — not an architecture reference
import { OptInType as SharedOptInType } from 'shared'
import { OptInType } from './OptInType'

// The opt-in type is defined twice - once here for GraphQL, once in `shared` for the
// database layer. Both sides filter and insert on these numbers; this holds them together.
describe('OptInType', () => {
  it('mirrors the shared enum value for value', () => {
    expect(OptInType.EMAIL_OPT_IN_REGISTER).toBe(SharedOptInType.EMAIL_OPT_IN_REGISTER)
    expect(OptInType.EMAIL_OPT_IN_RESET_PASSWORD).toBe(SharedOptInType.EMAIL_OPT_IN_RESET_PASSWORD)
    expect(OptInType.EMAIL_OPT_IN_CHANGE).toBe(SharedOptInType.EMAIL_OPT_IN_CHANGE)
  })
})
