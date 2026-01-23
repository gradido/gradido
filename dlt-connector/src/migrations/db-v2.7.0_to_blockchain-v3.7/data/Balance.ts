import Decimal from 'decimal.js-light'
import { AccountBalance, GradidoUnit, MemoryBlockPtr } from 'gradido-blockchain-js'
import { legacyCalculateDecay } from '../utils'
import { NegativeBalanceError } from '../errors'

export class Balance {
    private balance: GradidoUnit
    private date: Date
    private publicKey: MemoryBlockPtr
    private communityId: string

    constructor(publicKey: MemoryBlockPtr, communityId: string) {
        this.balance = new GradidoUnit(0)
        this.date = new Date()
        this.publicKey = publicKey
        this.communityId = communityId
    }

    static fromAccountBalance(accountBalance: AccountBalance, confirmedAt: Date, communityId: string): Balance {
        const balance = new Balance(accountBalance.getPublicKey()!, communityId)
        balance.update(accountBalance.getBalance(), confirmedAt)
        return balance
    }

    getBalance(): GradidoUnit {
        return this.balance
    }

    getDate(): Date {
        return this.date
    }

    updateLegacyDecay(amount: GradidoUnit, date: Date) {
        // make sure to copy instead of referencing
        const previousBalanceString = this.balance.toString()
        const previousDate = new Date(this.date.getTime())

        if (this.balance.equal(GradidoUnit.zero())) {
            this.balance = amount
            this.date = date
        } else {
            const decayedBalance = legacyCalculateDecay(new Decimal(this.balance.toString()), this.date, date ).toDecimalPlaces(4, Decimal.ROUND_CEIL)
            const newBalance = decayedBalance.add(new Decimal(amount.toString()))
            this.balance = GradidoUnit.fromString(newBalance.toString())
            this.date = date
        }
        if (this.balance.lt(GradidoUnit.zero())) {
            if (this.balance.lt(GradidoUnit.fromGradidoCent(100).negated())) {
                const previousDecayedBalance = legacyCalculateDecay(new Decimal(previousBalanceString), previousDate, date)
                const rounded = previousDecayedBalance.toDecimalPlaces(4, Decimal.ROUND_CEIL)
                console.log(`rounded: ${rounded}}`)
                throw new NegativeBalanceError(
                    `negative Gradido amount detected in Balance.updateLegacyDecay`,
                    previousBalanceString,
                    amount.toString(),
                    previousDecayedBalance.toString(),
                )
            } else {
                this.balance = GradidoUnit.zero()
            }
        }
    }

    update(amount: GradidoUnit, date: Date) {
        const previousBalance = new GradidoUnit(this.balance.toString())
        const previousDate = new Date(this.date.getTime())

        if (this.balance.equal(GradidoUnit.zero())) {
            this.balance = amount
            this.date = date
        } else {
            this.balance = this.balance
                .calculateDecay(this.date, date)
                .add(amount)
            this.date = date
        }
        if (this.balance.lt(GradidoUnit.zero())) {
            // ignore diffs less than a gradido cent
            if (this.balance.lt(GradidoUnit.fromGradidoCent(100).negated())) {
                const previousDecayedBalance = this.balance.calculateDecay(previousDate, date)
                throw new NegativeBalanceError(
                    `negative Gradido amount detected in Balance.update`,
                    previousBalance.toString(),
                    amount.toString(),
                    previousDecayedBalance.toString(),
                )
            } else {
                this.balance = GradidoUnit.zero()
            }
        }
    }

    getAccountBalance(): AccountBalance {
        return new AccountBalance(this.publicKey, this.balance, this.communityId)
    }
}
