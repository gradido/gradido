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

  it('comparedTo', () => {
    const a = GradidoUnit.fromGradidoCent(10n)
    const b = GradidoUnit.fromGradidoCent(3n)
    expect(a.comparedTo(b)).toEqual(7n)
    expect(b.comparedTo(a)).toEqual(-7n)
    expect(a.comparedTo(a)).toEqual(0n)
  })

  it('can be constructed from a number', () => {
    const value = 123.456
    const gdd = GradidoUnit.fromNumber(value)
    expect(gdd.toNumber()).toBe(value)
  })

  it('can decay', () => {
    const gdd = new GradidoUnit(10000n)
    const from = new Date('2022-01-01')
    const to = new Date('2022-01-02')
    const decay = gdd.calculateDecay(from, to)
    expect(decay.balance.gddCent).toBe(9981n)
    expect(decay.decay.gddCent).toBe(-19n)
    expect(decay.duration?.seconds).toBe(86400n)
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
    const buffed = gdd.requiredBeforeDecay(from, to)
    expect(buffed.gddCent).toBe(10019n)
    expect(buffed.decayed(from, to).gddCent).toBe(10000n)
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
      const duration = Duration.days(1)
      const buffed = amount.requiredBeforeDecay(duration)
      expect(buffed.gddCent).toBe(10019n)
      expect(buffed.decayForDuration(duration).gddCent).toBe(amount.gddCent)
    })

    it("has correct backward calculation 1'000 GDD, 1 minute", () => {
      const amount = GradidoUnit.fromNumber(1000.0)
      const duration = Duration.minutes(1)
      const buffed = amount.requiredBeforeDecay(duration)
      expect(buffed.gddCent).toBe(10000013n)
      expect(buffed.decayForDuration(duration).gddCent).toBe(amount.gddCent)
    })

    it("has correct backward calculation 10'000 GDD, 1 second", () => {
      const amount = GradidoUnit.fromNumber(10000.0)
      const duration = Duration.seconds(1)
      const buffed = amount.requiredBeforeDecay(duration)
      expect(buffed.gddCent).toBe(100000002n)
      expect(buffed.decayForDuration(duration).gddCent).toBe(amount.gddCent)
    })

    it('has correct forward calculation from number', () => {
      const amount = GradidoUnit.fromNumber(1.0019)
      const duration = Duration.days(1)
      expect(amount.decayForDuration(duration).gddCent).toBe(10000n)
    })
    it('has correct forward calculation from bigInt', () => {
      const amount = new GradidoUnit(10019n)
      const duration = Duration.days(1)
      expect(amount.decayForDuration(duration).gddCent).toBe(10000n)
    })
  })
  describe('link blocked amount decay test compare with blockchain', () => {
    const days14 = Duration.days(14)
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
      expect(link2Hold.toString(2, true)).toBe('15.40')
      expect(link2Hold.toString(2)).toBe('15.4')

      // db way: decay from last transaction to now (endDate) and then subtract sum of blocked amounts
      const decayedStartAmount = startAmount.decayedTo(endDate).balance
      expect(decayedStartAmount.toString(4, true)).toBe('1079.5730')
      expect(decayedStartAmount.toString(4)).toBe('1079.573')
      const blockedSum = link1Hold.add(link2Hold)
      const finalBalanceDb = decayedStartAmount.subtract(blockedSum)
      expect(finalBalanceDb.toString(4)).toBe('1053.8999')

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
      expect(blockchainState.balance.gddCent).not.toBe(finalBalanceDb.gddCent)
    })

    it('only one blocked time, large duration between create and end date', () => {
      // prepare
      const durationBetweenStartAndEnd = Duration.fromDateDiff(startDate, endDate)
      expect(durationBetweenStartAndEnd.seconds).toBe(891489n)
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')

      // db way: decay from last transaction to now (endDate) and then subtract sum of blocked amounts
      const decayedStartAmount = startAmount.decayedTo(endDate).balance
      expect(decayedStartAmount.toString(4, true)).toBe('1079.5730')
      expect(decayedStartAmount.toString(4)).toBe('1079.573')
      const finalBalanceDb = decayedStartAmount.subtract(link1Hold)
      expect(finalBalanceDb.toString(4)).toBe('1069.3038')

      const blocked1 = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))

      // new solution, decay link balance
      const blocked1Decayed = blocked1.decayedTo(endDate)
      expect(blocked1Decayed.balance.toString(4)).toBe('10.0836')
      const finalBalanceDbFixed = decayedStartAmount.subtract(blocked1Decayed.balance)
      expect(finalBalanceDbFixed.toString(4)).toBe('1069.4894')

      // blockchain way: subtract blocked amount at their creation date and proper decay the account balance before (that is what TemporalGradidoUnit is doing)
      const afterSubtractBlocked1 = startAmount.subtract(blocked1)
      expect(afterSubtractBlocked1.balance.toString(4)).toBe('1089.1746')
      const blockchainState = startAmount.subtract(blocked1).decayedTo(endDate)
      expect(blockchainState.balance.toString(4)).toBe('1069.4894')
      expect(blockchainState.balance.gddCent).not.toBe(finalBalanceDb.gddCent)
      expect(blockchainState.balance.gddCent).toBe(finalBalanceDbFixed.gddCent)
    })

    it('only one blocked time, small duration between create and end date', () => {
      // prepare
      const durationBetweenStartAndEnd = Duration.fromDateDiff(startDate, endDate)
      expect(durationBetweenStartAndEnd.seconds).toBe(891489n)
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')

      // db way: decay from last transaction to now (endDate) and then subtract sum of blocked amounts
      const decayedStartAmount = startAmount.decayedTo(endDate).balance
      expect(decayedStartAmount.toString(4, true)).toBe('1079.5730')
      expect(decayedStartAmount.toString(4)).toBe('1079.573')
      const finalBalanceDb = decayedStartAmount.subtract(link1Hold)
      expect(finalBalanceDb.toString(4)).toBe('1069.3038')

      const blocked1 = new TemporalGradidoUnit(link1Hold, new Date('2022-01-11 10:10:50Z'))

      // new solution, decay link balance
      const blocked1Decayed = blocked1.decayedTo(endDate)
      expect(blocked1Decayed.balance.toString(4)).toBe('10.2573')
      const finalBalanceDbFixed = decayedStartAmount.subtract(blocked1Decayed.balance)
      expect(finalBalanceDbFixed.toString(4)).toBe('1069.3157')

      // blockchain way: subtract blocked amount at their creation date and proper decay the account balance before (that is what TemporalGradidoUnit is doing)
      const afterSubtractBlocked1 = startAmount.subtract(blocked1)
      expect(afterSubtractBlocked1.balance.toString(4)).toBe('1070.5556')
      const blockchainState = startAmount.subtract(blocked1).decayedTo(endDate)
      expect(blockchainState.balance.toString(4)).toBe('1069.3157')
      expect(blockchainState.balance.gddCent).not.toBe(finalBalanceDb.gddCent)
      expect(blockchainState.balance.gddCent).toBe(finalBalanceDbFixed.gddCent)
    })

    it('only one blocked time, small duration between create and end date, large start amount', () => {
      // prepare
      const durationBetweenStartAndEnd = Duration.fromDateDiff(startDate, endDate)
      expect(durationBetweenStartAndEnd.seconds).toBe(891489n)
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100000.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')

      // db way: decay from last transaction to now (endDate) and then subtract sum of blocked amounts
      const decayedStartAmount = startAmount.decayedTo(endDate).balance
      expect(decayedStartAmount.toString(4)).toBe('1078670.7511')
      const finalBalanceDb = decayedStartAmount.subtract(link1Hold)
      expect(finalBalanceDb.toString(4)).toBe('1078660.4819')

      const blocked1 = new TemporalGradidoUnit(link1Hold, new Date('2022-01-11 10:10:50Z'))

      // new solution, decay link balance
      const blocked1Decayed = blocked1.decayedTo(endDate)
      expect(blocked1Decayed.balance.toString(4)).toBe('10.2573')
      const finalBalanceDbFixed = decayedStartAmount.subtract(blocked1Decayed.balance)
      expect(finalBalanceDbFixed.toString(4)).toBe('1078660.4938')

      // blockchain way: subtract blocked amount at their creation date and proper decay the account balance before (that is what TemporalGradidoUnit is doing)
      const afterSubtractBlocked1 = startAmount.subtract(blocked1)
      expect(afterSubtractBlocked1.balance.toString(4, true)).toBe('1079911.2470')
      expect(afterSubtractBlocked1.balance.toString(4)).toBe('1079911.247')
      const blockchainState = startAmount.subtract(blocked1).decayedTo(endDate)
      expect(blockchainState.balance.toString(4)).toBe('1078660.4937')
      expect(blockchainState.balance.gddCent).not.toBe(finalBalanceDb.gddCent)
      // expect(blockchainState.balance.gddCent).toBe(finalBalanceDbFixed.gddCent)
    })

    it('adjust link blocked amount to current time', () => {
      // prepare
      const durationBetweenStartAndEnd = Duration.fromDateDiff(startDate, endDate)
      expect(durationBetweenStartAndEnd.seconds).toBe(891489n)
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link2 = GradidoUnit.fromNumber(15)
      const link1Hold = link1.requiredBeforeDecay(days14)
      const link2Hold = link2.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      expect(link2Hold.toString(2, true)).toBe('15.40')
      expect(link2Hold.toString(2)).toBe('15.4')

      // db way: decay from last transaction to now (endDate) and then subtract sum of blocked amounts
      const decayedStartAmount = startAmount.decayedTo(endDate).balance
      expect(decayedStartAmount.toString(4, true)).toBe('1079.5730')
      expect(decayedStartAmount.toString(4)).toBe('1079.573')
      const blockedSum = link1Hold.add(link2Hold)
      const finalBalanceDb = decayedStartAmount.subtract(blockedSum)
      expect(finalBalanceDb.toString(4)).toBe('1053.8999')

      const blocked1 = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const blocked2 = new TemporalGradidoUnit(link2Hold, new Date('2022-01-05 07:02:51Z'))

      // new solution, decay link balance
      const blocked1Decayed = blocked1.decayedTo(endDate)
      expect(blocked1Decayed.balance.toString(4)).toBe('10.0836')
      const blocked2Decayed = blocked2.decayedTo(endDate)
      expect(blocked2Decayed.balance.toString(4)).toBe('15.2081')
      const finalBalanceDbFixed = decayedStartAmount
        .subtract(blocked1Decayed.balance)
        .subtract(blocked2Decayed.balance)
      expect(finalBalanceDbFixed.toString(4)).toBe('1054.2813')

      // blockchain way: subtract blocked amount at their creation date and proper decay the account balance before (that is what TemporalGradidoUnit is doing)
      const afterSubtractBlocked1 = startAmount.subtract(blocked1)
      expect(afterSubtractBlocked1.balance.toString(4)).toBe('1089.1746')
      const afterSubtractBlocked2 = afterSubtractBlocked1.subtract(blocked2)
      expect(afterSubtractBlocked2.balance.toString(4)).toBe('1067.8556')
      const blockchainState = startAmount.subtract(blocked1).subtract(blocked2).decayedTo(endDate)
      expect(blockchainState.balance.toString(4)).toBe('1054.2813')
      expect(blockchainState.balance.gddCent).not.toBe(finalBalanceDb.gddCent)
      expect(blockchainState.balance.gddCent).toBe(finalBalanceDbFixed.gddCent)
    })

    it('redeemed links', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const redeemedDate = new Date('2022-01-10 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // db
      const afterRedeemLinkDb = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkDb.balance.toString(4)).toBe('1073.2283')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1073.2282')
      // expect(afterAddingChangeFromLink1Redeem.balance.gddCent).toBe(afterRedeemLinkDb.balance.gddCent)
    })
    it('redeemed links with bigger numbers', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100000.921), startDate)
      const link1 = GradidoUnit.fromNumber(1000)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('1026.92')
      const redeemedDate = new Date('2022-01-10 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // db
      const afterRedeemLinkDb = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkDb.balance.toString(4)).toBe('1081322.9585')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1097498.0204')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1081322.9586')
      // expect(afterAddingChangeFromLink1Redeem.balance.gddCent).toBe(afterRedeemLinkDb.balance.gddCent)
    })
    it('redeemed links with later redeem', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const redeemedDate = new Date('2022-01-16 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // db
      const afterRedeemLinkDb = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkDb.balance.toString(4)).toBe('1060.9639')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1060.9639')
      expect(afterAddingChangeFromLink1Redeem.balance.gddCent).toBe(
        afterRedeemLinkDb.balance.gddCent,
      )
    })
    it('redeemed links with later redeem and bigger numbers', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100000.921), startDate)
      const link1 = GradidoUnit.fromNumber(1000)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('1026.92')
      const redeemedDate = new Date('2022-01-16 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // db
      const afterRedeemLinkDb = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkDb.balance.toString(4)).toBe('1069068.8409')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1097498.0204')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1069068.8409')
      expect(afterAddingChangeFromLink1Redeem.balance.gddCent).toBe(
        afterRedeemLinkDb.balance.gddCent,
      )
    })
    it('redeemed links with earlier redeem', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const redeemedDate = new Date('2022-01-02 12:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // db
      const afterRedeemLinkDb = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkDb.balance.toString(4)).toBe('1089.2778')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('1089.2778')
      expect(afterAddingChangeFromLink1Redeem.balance.gddCent).toBe(
        afterRedeemLinkDb.balance.gddCent,
      )
    })
    it('redeemed links with longer link duration', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(Duration.days(90))
      expect(link1Hold.toString(2)).toBe('11.86')
      const redeemedDate = new Date('2022-04-01 06:05:23Z')
      const link1RedeemTemporal = new TemporalGradidoUnit(link1, redeemedDate)

      // db
      const afterRedeemLinkDb = startAmount.subtract(link1RedeemTemporal)
      expect(afterRedeemLinkDb.balance.toString(4)).toBe('918.8817')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1087.5813')
      const afterAddingChangeFromLink1Redeem = afterLink1Founded.add(
        link1Temporal.subtract(link1RedeemTemporal),
      )
      expect(afterAddingChangeFromLink1Redeem.balance.toString(4)).toBe('918.8817')
      expect(afterAddingChangeFromLink1Redeem.balance.gddCent).toBe(
        afterRedeemLinkDb.balance.gddCent,
      )
    })
    it('deleted links', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const deletedDate = new Date('2022-01-10 06:05:23Z')

      // db
      const endAmount = startAmount.decayedTo(deletedDate)
      expect(endAmount.balance.toString(4)).toBe('1083.2283') // 10832282.510864

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Delete = afterLink1Founded.add(
        link1Temporal.decayedTo(deletedDate),
      )
      expect(afterAddingChangeFromLink1Delete.balance.toString(4)).toBe('1083.2282')
      // expect(afterAddingChangeFromLink1Delete.balance.gddCent).toBe(endAmount.balance.gddCent)
    })
    it('deleted link almost instantly', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const linkCreationDate = Duration.minutes(20).addToDate(startDate)
      const deletedDate = Duration.minutes(20).addToDate(linkCreationDate)

      // db
      const endAmount = startAmount.decayedTo(deletedDate)
      expect(endAmount.balance.toString(4, true)).toBe('1100.8630')
      expect(endAmount.balance.toString(4)).toBe('1100.863')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, linkCreationDate)
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1090.6228')
      const afterAddingChangeFromLink1Delete = afterLink1Founded.add(
        link1Temporal.decayedTo(deletedDate),
      )
      expect(afterAddingChangeFromLink1Delete.balance.toString(4, true)).toBe('1100.8630')
      expect(afterAddingChangeFromLink1Delete.balance.toString(4)).toBe('1100.863')
      expect(afterAddingChangeFromLink1Delete.balance.gddCent).toBe(endAmount.balance.gddCent)
    })
    it('deleted links after 14 days', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const deletedDate = days14.addToDate(startDate)

      // db
      const endAmount = startAmount.decayedTo(deletedDate)
      expect(endAmount.balance.toString(4, true)).toBe('1072.0560')
      expect(endAmount.balance.toString(4)).toBe('1072.056')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('1089.1746')
      const afterAddingChangeFromLink1Delete = afterLink1Founded.add(
        link1Temporal.decayedTo(deletedDate),
      )
      expect(afterAddingChangeFromLink1Delete.balance.toString(4, true)).toBe('1072.0560')
      expect(afterAddingChangeFromLink1Delete.balance.toString(4)).toBe('1072.056')
      expect(afterAddingChangeFromLink1Delete.balance.gddCent).toBe(endAmount.balance.gddCent)
    })
    it('deleted links after 14 days, bigger start amount', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(110000.921), startDate)
      const link1 = GradidoUnit.fromNumber(10)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('10.27')
      const deletedDate = days14.addToDate(startDate)

      // db
      const endAmount = startAmount.decayedTo(deletedDate)
      expect(endAmount.balance.toString(4)).toBe('107116.8102')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('109843.0531')
      const afterAddingChangeFromLink1Delete = afterLink1Founded.add(
        link1Temporal.decayedTo(deletedDate),
      )
      expect(afterAddingChangeFromLink1Delete.balance.toString(4)).toBe('107116.8102')
      expect(afterAddingChangeFromLink1Delete.balance.gddCent).toBe(endAmount.balance.gddCent)
    })

    it('deleted links after 14 days, bigger start amount and link amount', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(110000.921), startDate)
      const link1 = GradidoUnit.fromNumber(1000)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('1026.92')
      const deletedDate = days14.addToDate(startDate)

      // db
      const endAmount = startAmount.decayedTo(deletedDate)
      expect(endAmount.balance.toString(4)).toBe('107116.8102')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('108826.3974')
      const afterAddingChangeFromLink1Delete = afterLink1Founded.add(
        link1Temporal.decayedTo(deletedDate),
      )
      expect(afterAddingChangeFromLink1Delete.balance.toString(4)).toBe('107116.8102')
      expect(afterAddingChangeFromLink1Delete.balance.gddCent).toBe(endAmount.balance.gddCent)
    })
    it('deleted links after 14 days, small start amount and big link amount', () => {
      const startAmount = new TemporalGradidoUnit(GradidoUnit.fromNumber(1100.921), startDate)
      const link1 = GradidoUnit.fromNumber(1000)
      const link1Hold = link1.requiredBeforeDecay(days14)
      expect(link1Hold.toString(2)).toBe('1026.92')
      const deletedDate = days14.addToDate(startDate)

      // db
      const endAmount = startAmount.decayedTo(deletedDate)
      expect(endAmount.balance.toString(4, true)).toBe('1072.0560')
      expect(endAmount.balance.toString(4)).toBe('1072.056')

      // blockchain
      const link1Temporal = new TemporalGradidoUnit(link1Hold, new Date('2022-01-02 10:10:50Z'))
      const afterLink1Founded = startAmount.subtract(link1Temporal)
      expect(afterLink1Founded.balance.toString(4)).toBe('72.5189')
      const afterAddingChangeFromLink1Delete = afterLink1Founded.add(
        link1Temporal.decayedTo(deletedDate),
      )
      expect(afterAddingChangeFromLink1Delete.balance.toString(4, true)).toBe('1072.0560')
      expect(afterAddingChangeFromLink1Delete.balance.toString(4)).toBe('1072.056')
      expect(afterAddingChangeFromLink1Delete.balance.gddCent).toBe(endAmount.balance.gddCent)
    })
  })
})
