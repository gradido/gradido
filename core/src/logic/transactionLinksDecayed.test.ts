import { describe, expect, it, mock } from 'bun:test'
import { bibiBloxberg } from 'database'
import { CODE_VALID_DAYS_DURATION, Duration, GradidoUnit } from 'shared'
import { calculateDecay } from 'shared-native'
import { transactionLinksDecayed } from './transactionLinksDecayed'

const startDate = new Date('2022-03-21T03:33:33Z')

describe('transactionLinksDecayed', () => {
  it('should calculate decayed amounts correctly', async () => {
    const transactionLinks = [
      {
        email: bibiBloxberg.email!,
        amount: GradidoUnit.fromNumber(100.5),
        memo: 'test',
        createdAt: Duration.days(10).addToDate(startDate),
        holdAvailableAmount: GradidoUnit.fromNumber(100.5).requiredBeforeDecay(
          Duration.days(CODE_VALID_DAYS_DURATION),
        ),
      },
      {
        email: bibiBloxberg.email!,
        amount: GradidoUnit.fromNumber(17.21),
        memo: 'test',
        createdAt: Duration.days(7).addToDate(startDate),
        holdAvailableAmount: GradidoUnit.fromNumber(17.21).requiredBeforeDecay(
          Duration.days(CODE_VALID_DAYS_DURATION),
        ),
      },
      {
        email: bibiBloxberg.email!,
        amount: GradidoUnit.fromNumber(124.64),
        memo: 'test',
        createdAt: Duration.days(3).addToDate(startDate),
        holdAvailableAmount: GradidoUnit.fromNumber(124.64).requiredBeforeDecay(
          Duration.days(CODE_VALID_DAYS_DURATION),
        ),
      },
      {
        email: bibiBloxberg.email!,
        amount: GradidoUnit.fromNumber(100),
        memo: 'test',
        createdAt: Duration.days(1).addToDate(startDate),
        holdAvailableAmount: GradidoUnit.fromNumber(100).requiredBeforeDecay(
          Duration.days(CODE_VALID_DAYS_DURATION),
        ),
      },
    ]

    // calculate decayed sum manually
    let decayedSum = new GradidoUnit(0n)
    let sumAmount = new GradidoUnit(0n)
    const endDate = Duration.days(12).addToDate(startDate)
    const linkTime = Duration.days(CODE_VALID_DAYS_DURATION)
    for (const tx of transactionLinks) {
      const duration = GradidoUnit.effectiveDecayDuration(tx.createdAt!, endDate)
      const gddAmount = GradidoUnit.fromNumber(tx.amount).gddCent
      const holdAvailableAmount = calculateDecay(gddAmount, BigInt(-linkTime.seconds))
      const decayed = calculateDecay(holdAvailableAmount, BigInt(duration.seconds))
      decayedSum = decayedSum.add(GradidoUnit.fromGradidoCent(decayed))
      sumAmount = sumAmount.add(GradidoUnit.fromNumber(tx.amount))
    }

    mock.module('database', () => {
      return {
        transactionLinksPendingFromUserOrderByIdASC: mock(
          async (userId: number, count: number, lastId: number, date: Date) => transactionLinks,
        ),
      }
    })

    const result = await transactionLinksDecayed(0, endDate)
    expect(result.sumAmount.comparedTo(sumAmount)).toBe(0n)
    expect(result.sumHoldAvailableDecayedAmount.comparedTo(decayedSum)).toBe(0n)
    expect(result.transactionLinkCount).toBe(transactionLinks.length)
    // verified reference decay value for fixed test dataset
    expect(result.sumHoldAvailableDecayedAmount.comparedTo(new GradidoUnit(3467208n))).toBe(0n)
  })
})
