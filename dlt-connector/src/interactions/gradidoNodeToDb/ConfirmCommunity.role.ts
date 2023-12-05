import { CommunityRepository } from '@/data/Community.repository'

import { AbstractConfirm } from './AbstractConfirm.role'

export class ConfirmCommunityRole extends AbstractConfirm {
  public async confirm(): Promise<void> {
    await CommunityRepository.confirmCommunityAndAccounts(
      this.confirmedTransactionRole.getConfirmedAt(),
      this.confirmTransactionsContext.getIotaTopic(),
    )
  }
}
