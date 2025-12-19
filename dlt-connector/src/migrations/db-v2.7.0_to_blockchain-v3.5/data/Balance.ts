import Decimal from 'decimal.js-light'
import { GradidoUnit } from 'gradido-blockchain-js'
import { legacyCalculateDecay } from '../utils'

export class Balance {
    private balance: GradidoUnit
    private date: Date
    public constructor()
    {
        this.balance = new GradidoUnit(0)
        this.date = new Date()
    }

    public update(amount: Decimal, date: Date) {
        if (this.balance.equal(GradidoUnit.zero())) {
            this.balance = GradidoUnit.fromString(amount.toString())
            this.date = date
        } else {
            const decayedBalance = legacyCalculateDecay(new Decimal(this.balance.toString()), this.date, date )
            const newBalance = decayedBalance.add(amount)
            this.balance = GradidoUnit.fromString(newBalance.toString())
            this.date = date
        }
    }
}
