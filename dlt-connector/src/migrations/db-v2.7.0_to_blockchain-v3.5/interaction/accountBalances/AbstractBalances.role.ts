import { AccountBalances } from 'gradido-blockchain-js'

export class AbstractBalancesRole {
    public accountBalances: AccountBalances

    public constructor() {
        this.accountBalances = new AccountBalances()
    }

}