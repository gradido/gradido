import { TransactionType, getTransactionTypeEnumValue } from '@/graphql/enum/TransactionType'
import { LogError } from '@/server/LogError'
import { Account } from '@entity/Account'
import { Transaction } from '@entity/Transaction'
import { TransactionRepository } from './Transaction.repository'
import { Decimal } from 'decimal.js-light'

export class TransactionLogic {
    constructor(private transaction: Transaction) {}
    public getTransactionType(): TransactionType {
        const type = getTransactionTypeEnumValue(this.transaction.type)
        if (type === undefined){
            throw new LogError('invalid transaction type stored in transaction')
        }
        return type
    } 
    // if updated, update also TransactionRepository.getLastTransactionForBalanceAccount
    public getBalanceAccount(): Account | undefined | null {
        switch (this.getTransactionType()) {
            case TransactionType.GRADIDO_CREATION:
            return this.transaction.recipientAccount
            case TransactionType.GRADIDO_TRANSFER:
            case TransactionType.GRADIDO_DEFERRED_TRANSFER:
            return this.transaction.signingAccount
            case TransactionType.REGISTER_ADDRESS:
            case TransactionType.COMMUNITY_ROOT:
            case TransactionType.GROUP_FRIENDS_UPDATE:
            return null
        }
    }
    
    public async calculateBalanceCreatedAt(): Promise<number> {
        // find last transaction for this balance account
        // take value + decay + value
        const balanceAccount = this.getBalanceAccount()
        if (!balanceAccount) {
          throw new LogError("couldn't find balance account for transaction")
        }
        const prevTransaction = await TransactionRepository.getLastTransactionForBalanceAccount(balanceAccount)
        let balance = new Decimal(0)
        if (prevTransaction) {
            balance = prevTransaction.accountBalanceCreatedAt
            
        }
    }
    
}