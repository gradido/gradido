import Decimal from "decimal.js-light"
import { FederationVoteFailedError } from "./FederationVoteFailed.error"
import { FederationSettlementFailedError } from "./FederationSettlementFailed.error"
import { SendCoinsResult } from "@/federation/client/1_0/model/SendCoinsResult"

// Context
export class ProcessXComSendCoinsContext {
  constructor(
    private sender: CoinsSenderRole,
    private receiver: CoinsReceiverRole,
    private federation: FederationClientRole,
    private amount: Decimal,
    private memo: string,
    private date: Date
  ) {}

  async initiate() {
    await this.sender.assertNoPendingTransactions()
    await this.receiver.assertNoPendingTransactions()

    this.sender.ensureSufficientBalance(this.amount, this.date)

    const result = await this.federation.vote(this.sender, this.receiver, this.amount, this.memo, this.date)
    if (!result.vote) throw new FederationVoteFailedError()

    await this.sender.createPendingTransaction(result, this.receiver, this.amount, this.memo, this.date)
    return result
  }

  async commit(result: SendCoinsResult) {
    const pendingTx = await this.sender.findPendingTransaction(result, this.memo, this.date)
    const ack = await this.federation.settle(pendingTx)
    if (!ack) throw new FederationSettlementFailedError()

    await this.sender.settlePendingTransaction(pendingTx)
    return ack
  }
}