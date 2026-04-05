import { User as DbUser, Community as DbCommunity } from 'database'
import { Decimal } from 'decimal.js-light'


export class XComSendCoinsDto {
  sender: DbUser
  senderCom: DbCommunity
  receiverCom: DbCommunity
  creationDate: Date
  amount: Decimal
  memo: string
  voteResult: SendCoinsResult
  senderBalance: SenderBalanceResult
}
