import { GradidoTransactionBuilder } from 'gradido-blockchain-js'
import { HieroId } from '../../schemas/typeGuard.schema'

export abstract class AbstractTransactionRole {
  abstract getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder>
  abstract getSenderCommunityTopicId(): HieroId
  abstract getRecipientCommunityTopicId(): HieroId
}
