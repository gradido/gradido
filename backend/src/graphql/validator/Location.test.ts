// AI-GENERATED — not an architecture reference

import { Location } from '@model/Location'
import { validate } from 'class-validator'

import { UpdateUserInfosArgs } from '@/graphql/arg/UpdateUserInfosArgs'

/**
 * The decorator itself, on the args class that really carries it -- not the rule behind it,
 * which has its own test in `data/Location.logic.test.ts`. What is measured here is the
 * wiring: that the mutation refuses what is not a place, and that "not sent" and "sent as
 * null" still come through, because one layer up those two mean "leave it alone" and
 * "clear it".
 *
 * ⛔ Before 10.09.2026 nothing here could fail. The check was
 * `Location2Point(value).type === 'Point'`, and that function writes `"type": "Point"` in
 * both of its branches.
 */
describe('isValidLocation on updateUserInfos', () => {
  const withLocation = (gmsLocation: unknown): UpdateUserInfosArgs => {
    const args = new UpdateUserInfosArgs()
    args.gmsLocation = gmsLocation as Location
    return args
  }

  // Only this field's complaints: the args class carries a validator on nearly every
  // property, and a bare instance fails several of them for reasons that have nothing to
  // do with a position.
  const fehler = async (gmsLocation: unknown): Promise<string[]> => {
    const found = await validate(withLocation(gmsLocation))
    return found
      .filter((one) => one.property === 'gmsLocation')
      .flatMap((one) => Object.keys(one.constraints ?? {}))
  }

  it('lets a pair of numbers through', async () => {
    expect(await fehler({ latitude: 49.28, longitude: 9.69 })).toEqual([])
  })

  it('lets a zero coordinate through -- the prime meridian is a place', async () => {
    expect(await fehler({ latitude: 51.5, longitude: 0 })).toEqual([])
  })

  it('lets an untouched field through', async () => {
    const args = new UpdateUserInfosArgs()
    const found = await validate(args)
    expect(found.filter((one) => one.property === 'gmsLocation')).toEqual([])
  })

  it('lets an explicit null through -- one layer up that means "clear it"', async () => {
    expect(await fehler(null)).toEqual([])
  })

  it.each([
    ['the empty object -- the shape that used to pass', {}],
    ['half a pair', { latitude: 49.28 }],
    ['a latitude past the pole', { latitude: 999, longitude: 9.69 }],
    ['two empty strings, as the admin used to send when clearing', { latitude: '', longitude: '' }],
  ])('refuses %s', async (_name, gmsLocation) => {
    expect(await fehler(gmsLocation)).toContain('isValidLocation')
  })

  // The one that did not merely pass but BROKE: the scalar copies fields through
  // unchecked, so text arrived at Location2Point, JSON.parse threw inside the validator,
  // and the member got a raw 500 rather than a rejection.
  it('refuses text without throwing', async () => {
    await expect(fehler({ latitude: 'abc', longitude: 'def' })).resolves.toContain(
      'isValidLocation',
    )
  })
})
