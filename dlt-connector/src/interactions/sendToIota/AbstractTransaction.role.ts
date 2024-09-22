import { GradidoTransactionBuilder } from 'gradido-blockchain-js'

export abstract class AbstractTransactionRole {
  abstract getGradidoTransactionBuilder(): Promise<GradidoTransactionBuilder>
  abstract getSenderCommunityUuid(): string
  abstract getRecipientCommunityUuid(): string
}
