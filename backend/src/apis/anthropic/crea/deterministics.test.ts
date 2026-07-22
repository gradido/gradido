import {
  buildSalutation,
  computeDiscrepancy,
  GDD_PER_HOUR,
  isCapReached,
  resolveEnteredGdd,
  resolveEnteredHours,
  SALUTATION_PLACEHOLDER,
  sumActivityHours,
} from './deterministics'

describe('crea deterministics — hours <-> GDD (1 h = 20 GDD)', () => {
  it('derives the entered hours from the GDD amount when only that is given', () => {
    expect(resolveEnteredHours({ enteredGdd: 200 })).toBe(10)
    expect(resolveEnteredHours({ enteredHours: 7 })).toBe(7)
    expect(resolveEnteredHours({})).toBeNull()
  })

  it('derives the entered GDD amount from the hours when only those are given', () => {
    expect(resolveEnteredGdd({ enteredHours: 3 })).toBe(60)
    expect(resolveEnteredGdd({ enteredGdd: 120 })).toBe(120)
    expect(resolveEnteredGdd({})).toBeNull()
  })

  it('keeps the calibration constant at 20', () => {
    expect(GDD_PER_HOUR).toBe(20)
  })
})

describe('crea deterministics — monthly cap (info only)', () => {
  it('reports the cap only at or above 50 hours', () => {
    expect(isCapReached(49)).toBe(false)
    expect(isCapReached(50)).toBe(true)
    expect(isCapReached(80)).toBe(true)
    expect(isCapReached(null)).toBe(false)
    expect(isCapReached(undefined)).toBe(false)
  })
})

describe('crea deterministics — direction-aware discrepancy (E-012)', () => {
  it('is none within tolerance or when a figure is missing', () => {
    expect(computeDiscrepancy(10, 10)).toBe('none')
    expect(computeDiscrepancy(10.5, 10)).toBe('none') // within max(1 h, 15%)
    expect(computeDiscrepancy(null, 10)).toBe('none')
    expect(computeDiscrepancy(10, null)).toBe('none')
    expect(computeDiscrepancy(10, 0)).toBe('none')
  })

  it('flags text_below_entered when the text has clearly fewer hours', () => {
    expect(computeDiscrepancy(2, 10)).toBe('text_below_entered')
  })

  it('flags text_above_entered when the text has clearly more hours (covers correct capping)', () => {
    expect(computeDiscrepancy(150, 50)).toBe('text_above_entered')
  })

  it('never inquires "below" for a retiree or child, but still appreciates "above"', () => {
    expect(computeDiscrepancy(2, 10, 'Rentner')).toBe('none')
    expect(computeDiscrepancy(2, 10, 'child')).toBe('none')
    expect(computeDiscrepancy(80, 50, 'Rentner')).toBe('text_above_entered')
  })
})

describe('crea deterministics — activity hour sum', () => {
  it('sums the activity hours, or null when there are none', () => {
    expect(sumActivityHours({ activities: [{ hours: 2 }, { hours: 3 }] })).toBe(5)
    expect(sumActivityHours({ activities: [] })).toBeNull()
    expect(sumActivityHours({})).toBeNull()
  })
})

describe('crea deterministics — salutation (PII stays local)', () => {
  it('resolves male and female names with certainty', () => {
    expect(buildSalutation('Thomas')).toEqual({ salutation: 'Lieber Thomas', uncertain: false })
    expect(buildSalutation('Maria')).toEqual({ salutation: 'Liebe Maria', uncertain: false })
  })

  it('normalises umlauts before the gender lookup', () => {
    expect(buildSalutation('Jürgen')).toEqual({ salutation: 'Lieber Jürgen', uncertain: false })
  })

  it('keeps an ambiguous name but defaults to the neutral "Hallo" and flags it (E-014)', () => {
    expect(buildSalutation('Kim')).toEqual({ salutation: 'Hallo Kim', uncertain: true })
  })

  it('falls back to the neutral "Hallo" with no name', () => {
    expect(buildSalutation(null)).toEqual({ salutation: 'Hallo', uncertain: true })
    expect(buildSalutation('')).toEqual({ salutation: 'Hallo', uncertain: true })
  })

  it('lets an explicit override win over the heuristic', () => {
    expect(buildSalutation('Thomas', 'Hallo Tom')).toEqual({
      salutation: 'Hallo Tom',
      uncertain: false,
    })
  })

  it('exposes the placeholder the model must emit', () => {
    expect(SALUTATION_PLACEHOLDER).toBe('[ANREDE]')
  })
})
