import { describe, expect, it } from 'bun:test'
import Decimal from 'decimal.js-light'
import { calculateDecay as calculateDecayNative } from 'shared-native'
import { Duration } from './Duration'
import { GradidoUnit } from './GradidoUnit'
import { TemporalGradidoUnit } from './TemporalGradidoUnit'

describe('GradidoUnit', () => {
  it('adds properly', () => {
    const a = GradidoUnit.fromGradidoCent(10n)
    const b = GradidoUnit.fromGradidoCent(3n)
    const sum = a.add(b)
    expect(sum.gddCent).toEqual(13n)
  })

  it('subtracts properly', () => {
    const a = GradidoUnit.fromGradidoCent(10n)
    const b = GradidoUnit.fromGradidoCent(3n)
    const diff = a.subtract(b)
    expect(diff.gddCent).toEqual(7n)
  })

  it('can be constructed from a number', () => {
    const value = 123.456
    const gdd = GradidoUnit.fromNumber(value)
    expect(gdd.toNumber()).toBe(value)
  })

  it('can decay', () => {
    const gdd = GradidoUnit.fromGradidoCent(10000n)
    const from = new Date('2022-01-01')
    const to = new Date('2022-01-02')
    const decay = gdd.calculateDecay(from, to)
    expect(decay.balance.toNumber()).toBe(0.9981)
    expect(decay.decay.toNumber()).toBe(-0.0019)
    expect(decay.duration).toBe(86400)
    expect(decay.start).toBe(from)
    expect(decay.end).toBe(to)
  })

  it('calculateDecay called with invalid dates', () => {
    const gdd = GradidoUnit.fromGradidoCent(10000n)
    const from = new Date('2022-01-02')
    const to = new Date('2022-01-01')
    expect(() => gdd.calculateDecay(from, to)).toThrow(
      'effectiveDecayDuration: to < from, reverse decay calculation is invalid',
    )
  })

  it('decayed', () => {
    const gdd = GradidoUnit.fromGradidoCent(10000n)
    const from = new Date('2022-01-01')
    const to = new Date('2022-01-02')
    const decayed = gdd.decayed(from, to)
    expect(decayed.gddCent).toBe(9981n)
  })

  it('can calculate required amount before decay', () => {
    const gdd = GradidoUnit.fromGradidoCent(10000n)
    const from = new Date('2022-01-01')
    const to = new Date('2022-01-02')
    const decayed = gdd.requiredBeforeDecay(from, to)
    expect(decayed.gddCent).toBe(10019n)
  })

  describe('toString', () => {
    it('with default places after comma', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      expect(gdd.toString(4)).toBe('1.2345')
    })

    it('with 3 places after comma', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      expect(gdd.toString(3)).toBe('1.235')
    })

    it('with 2 places after comma', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      expect(gdd.toString(2)).toBe('1.23')
    })

    it('with 1 place after comma', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      expect(gdd.toString(1)).toBe('1.2')
    })

    it('with 0 places after comma', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      expect(gdd.toString(0)).toBe('1')
    })
    it('with 5 places after comma (throws error)', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      expect(() => gdd.toString(5)).toThrow('Precision must be between 0 and 4')
    })
    it('big, but valid number with 3 places after comma', () => {
      const gdd = GradidoUnit.fromGradidoCent(156789012345n)
      expect(gdd.toString(3)).toBe('15678901.235')
    })
  })
  describe('performance compared with DecimalJs', () => {
    it('GradidoUnit.fromString 10k', () => {
      for (let i = 0; i < 10000; i++) {
        GradidoUnit.fromString('1.2345')
      }
    })
    it('Decimal.js fromString 10k', () => {
      for (let i = 0; i < 10000; i++) {
        new Decimal('1.2345')
      }
    })
    it('GradidoUnit.toString 10k', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      for (let i = 0; i < 10000; i++) {
        gdd.toString()
      }
    })
    it('Decimal.js toString 10k', () => {
      const d = new Decimal('1.2345')
      for (let i = 0; i < 10000; i++) {
        d.toString()
      }
    })
    it('GradidoUnit.toString 10k without after comma', () => {
      const gdd = GradidoUnit.fromGradidoCent(12345n)
      for (let i = 0; i < 10000; i++) {
        gdd.toString(0)
      }
    })
    it('Decimal.js toString 10k without after comma', () => {
      const d = new Decimal('1.2345')
      for (let i = 0; i < 10000; i++) {
        d.toDecimalPlaces(0).toString()
      }
    })
    it('GradidoUnit.toString 10k big number', () => {
      const gdd = GradidoUnit.fromGradidoCent(156789012345n)
      for (let i = 0; i < 10000; i++) {
        gdd.toString()
      }
    })
    it('Decimal.js toString 10k big number', () => {
      const d = new Decimal('15678901.2345')
      for (let i = 0; i < 10000; i++) {
        d.toString()
      }
    })
  })
  describe('legacy decay tests', () => {
    it('with large values', () => {
      const amount = GradidoUnit.fromNumber(100.0)
      const seconds = 1209600n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(973781n)
    })

    it('with one year', () => {
      const amount = GradidoUnit.fromNumber(100.0)
      const seconds = 31556952n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(500000n)
    })

    it('has correct backward calculation 1 GDD, 1 day', () => {
      const amount = GradidoUnit.fromNumber(1.0)
      const seconds = -(3600n * 24n)
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10019n)
    })

    it("has correct backward calculation 1'000 GDD, 1 minute", () => {
      const amount = GradidoUnit.fromNumber(1000.0)
      const seconds = -60n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10000013n)
    })

    it("has correct backward calculation 10'000 GDD, 1 second", () => {
      const amount = GradidoUnit.fromNumber(10000.0)
      const seconds = -1n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(100000002n)
    })

    it('has correct forward calculation from number', () => {
      const amount = GradidoUnit.fromNumber(1.0019)
      const seconds = 3600n * 24n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10000n)
    })
    it('has correct forward calculation from bigInt', () => {
      const amount = GradidoUnit.fromGradidoCent(10019n)
      const seconds = 3600n * 24n
      expect(calculateDecayNative(amount.gddCent, seconds)).toBe(10000n)
    })
  })
  describe('legacy link blocked amount decay test', () => {
    const days14 = Duration.days(14n)
    const startDate = new Date('2022-01-01 17:12:01Z')
    const endDate = new Date('2022-01-12 00:50:10Z')

    it('open links', () => {
      // prepare
      const durationBetweenStartAndEnd = Duration.fromDateDiff(startDate, endDate)
      expect(durationBetweenStartAndEnd.seconds).toBe(891489n)
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link2 = GradidoUnit.fromNumber(15)
      const link1Hold = link1.requiredBeforeDecay(days14)
      const link2Hold = link2.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      expect(link2Hold.toString(2)).toBe('15.40')

      // legacy way: decay from last transaction to now (endDate) and then subtract sum of blocked amounts
      const decayedStartAmount = startAmount.decayedTo(endDate).balance
      expect(decayedStartAmount.toString(4)).toBe('1079.5730')
      const blockedSum = link1Hold.add(link2Hold)
      const finalBalanceLegacy = decayedStartAmount.subtract(blockedSum)
      expect(finalBalanceLegacy.toString(4)).toBe('1053.8999')

      // blockchain way: subtract blocked amount at their creation date and proper decay the account balance before (that is what TemporalGradidoUnit is doing)
      const blocked1 = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const blocked2 = new TemporalGradidoUnit(link2Hold, new Date('2022-01-05 07:02:51Z'))
      const durationBetweenStartAndBlocked1 = Duration.fromDateDiff(startDate, blocked1.balanceDate)
      const durationBetweenBlocked1AndBlocked2 = Duration.fromDateDiff(
        blocked1.balanceDate,
        blocked2.balanceDate,
      )
      const durationBetweenBlocked2AndEnd = Duration.fromDateDiff(blocked2.balanceDate, endDate)
      expect(durationBetweenStartAndBlocked1.seconds).toBe(61129n)
      expect(durationBetweenBlocked1AndBlocked2.seconds).toBe(247921n)
      expect(durationBetweenBlocked2AndEnd.seconds).toBe(582439n)
      const afterSubtractBlocked1 = startAmount.subtract(blocked1)
      expect(afterSubtractBlocked1.balance.toString(4)).toBe('1089.1746')
      const afterSubtractBlocked2 = afterSubtractBlocked1.subtract(blocked2)
      expect(afterSubtractBlocked2.balance.toString(4)).toBe('1067.8556')
      const blockchainState = startAmount.subtract(blocked1).subtract(blocked2).decayedTo(endDate)
      expect(blockchainState.balance.toString(4)).toBe('1054.2813')
      expect(blockchainState.balance.gddCent).not.toBe(finalBalanceLegacy.gddCent)
    })

    it('redeemed links', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const redeemedDate = new Date('2022-01-10 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // legacy
      const afterRedeemLinkLegacy = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkLegacy.balance.toString(4)).toBe('1073.2283')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1073.2282')
    })
    it('redeemed links with bigger numbers', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100000.921), startDate)
      const link1 = GradidoUnit.fromNumber(1000)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('1026.92')
      const redeemedDate = new Date('2022-01-10 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // legacy
      const afterRedeemLinkLegacy = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkLegacy.balance.toString(4)).toBe('1081322.9585')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1097498.0204')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1081322.9586')
    })
    it('redeemed links with later redeem', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const redeemedDate = new Date('2022-01-16 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // legacy
      const afterRedeemLinkLegacy = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkLegacy.balance.toString(4)).toBe('1060.9639')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1060.9639')
    })
    it('redeemed links with longer link duration', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(Duration.days(90n))
      expect(link1Hold.toString(2)).toBe('11.86')
      const redeemedDate = new Date('2022-04-01 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // legacy
      const afterRedeemLinkLegacy = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkLegacy.balance.toString(4)).toBe('918.8817')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1087.5813')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('918.8817')
    })
    it('deleted links', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(Duration.days(14n))
      expect(link1Hold.toString(2)).toBe('10.27')
      const deletedDate = new Date('2022-01-10 06:05:23Z')

      // legacy
      const endAmount = startAmount.decayedTo(deletedDate)
      expect(endAmount.balance.toString(4)).toBe('1083.2283')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Delete = afterLink1Founded.add(
        link1Temporal.decayedTo(deletedDate),
      )
      expect(afterAddingChangeFromLink1Delete.balance.toString(4)).toBe('1083.2282')
    })
  })
})
