import { TransactionBody } from './3_3/TransactionBody'
import { Account } from '@entity/Account'
import { TransactionDraft } from '@/graphql/input/TransactionDraft'
import { UserAccountDraft } from '@/graphql/input/UserAccountDraft'
import { CommunityDraft } from '@/graphql/input/CommunityDraft'
import { InputTransactionType } from '@/graphql/enum/InputTransactionType'
import { GradidoCreation } from './3_3/GradidoCreation'
import { GradidoTransfer } from './3_3/GradidoTransfer'
import { RegisterAddress } from './3_3/RegisterAddress'
import { Community } from '@entity/Community'
import { CommunityRoot } from './3_3/CommunityRoot'

export class TransactionBodyBuilder {
  private signingAccount?: Account
  private recipientAccount?: Account

  public setSigningAccount(signingAccount: Account): TransactionBodyBuilder {
    this.signingAccount = signingAccount
    return this
  }

  public setRecipientAccount(recipientAccount: Account): TransactionBodyBuilder {
    this.recipientAccount = recipientAccount
    return this
  }

  public fromTransactionDraft(transactionDraft: TransactionDraft): TransactionBody {
    const body = new TransactionBody(transactionDraft)
    // TODO: load pubkeys for sender and recipient user from db
    switch (transactionDraft.type) {
      case InputTransactionType.CREATION:
        body.creation = new GradidoCreation(transactionDraft, this.recipientAccount)
        body.data = 'gradidoCreation'
        break
      case InputTransactionType.SEND:
      case InputTransactionType.RECEIVE:
        body.transfer = new GradidoTransfer(
          transactionDraft,
          this.signingAccount,
          this.recipientAccount,
        )
        body.data = 'gradidoTransfer'
        break
    }
    return body
  }

  public fromUserAccountDraft(userAccountDraft: UserAccountDraft): TransactionBody {
    const body = new TransactionBody(userAccountDraft)
    body.registerAddress = new RegisterAddress(
      userAccountDraft,
      this.signingAccount?.user,
      this.signingAccount,
    )
    body.data = 'registerAddress'
    return body
  }

  public fromCommunityDraft(communityDraft: CommunityDraft, community: Community): TransactionBody {
    const body = new TransactionBody(communityDraft)
    body.communityRoot = new CommunityRoot(community)
    body.data = 'communityRoot'
    return body
  }
}
