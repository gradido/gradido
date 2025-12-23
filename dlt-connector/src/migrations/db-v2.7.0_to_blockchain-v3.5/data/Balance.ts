import Decimal from 'decimal.js-light'
import { AccountBalance, GradidoUnit, MemoryBlockPtr } from 'gradido-blockchain-js'
import { legacyCalculateDecay } from '../utils'

export class Balance {
    private balance: GradidoUnit
    private date: Date
    private publicKey: MemoryBlockPtr
    private communityId?: string | null

    constructor(publicKey: MemoryBlockPtr, communityId?: string | null) {
        this.balance = new GradidoUnit(0)
        this.date = new Date()
        this.publicKey = publicKey
        this.communityId = communityId
    }

    static fromAccountBalance(accountBalance: AccountBalance, confirmedAt: Date): Balance {
        const balance = new Balance(accountBalance.getPublicKey()!, accountBalance.getCommunityId() || null)
        balance.update(accountBalance.getBalance(), confirmedAt)
        return balance
    }

    getBalance(): GradidoUnit {
        return this.balance
    }

    updateLegacyDecay(amount: GradidoUnit, date: Date) {
        const previousBalanceString = this.balance.toString()
        if (this.balance.equal(GradidoUnit.zero())) {
            this.balance = amount
            this.date = date
        } else {
            const decayedBalance = legacyCalculateDecay(new Decimal(this.balance.toString()), this.date, date )
            const newBalance = decayedBalance.add(new Decimal(amount.toString()))
            this.balance = GradidoUnit.fromString(newBalance.toString())
            this.date = date
        }
        if (this.balance.lt(GradidoUnit.zero())) {
            throw new Error(`negative Gradido amount detected in Balance.updateLegacyDecay, previous balance: ${previousBalanceString}, amount: ${amount.toString()}`)
        }
    }

    update(amount: GradidoUnit, date: Date) {
        const previousBalanceString = this.balance.toString()
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
            throw new Error(`negative Gradido amount detected in Balance.update, previous balance: ${previousBalanceString}, amount: ${amount.toString()}`)
        }
    }

    getAccountBalance(): AccountBalance {
        return new AccountBalance(this.publicKey, this.balance, this.communityId || '')
    }
}
