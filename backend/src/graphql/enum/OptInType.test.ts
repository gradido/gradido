// AI-GENERATED — not an architecture reference
import { OptInType as SharedOptInType } from 'shared'
import { OptInType } from './OptInType'

// The opt-in type is defined twice - once here for GraphQL, once in `shared` for the
// database layer. Both sides filter and insert on these numbers; this holds them together.
describe('OptInType', () => {
  // A numeric enum carries its reverse mapping as well; only the names count here.
  const byName = (value: object) =>
    Object.fromEntries(Object.entries(value).filter(([key]) => Number.isNaN(Number(key))))

  it('mirrors the shared enum member for member - no more, no less', () => {
    expect(byName(OptInType)).toEqual(byName(SharedOptInType))
  })
})
