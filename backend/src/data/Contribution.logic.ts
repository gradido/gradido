import { Contribution } from 'database'
import { Decimal } from 'decimal.js-light'

import {
  getUserCreation,
  updateCreations,
  validateContribution,
} from '@/graphql/resolver/util/creations'
import { LogError } from '@/server/LogError'

export class ContributionLogic {
  // how much gradido can be still created
  private availableCreationSums?: Decimal[]
  public constructor(private self: Contribution) {}

  /**
   * retrieve from db and return available creation sums array
   * @param clientTimezoneOffset
   * @param putThisBack if true, amount from this contribution will be added back to the availableCreationSums array,
   *                    as if this creation wasn't part of it, used for update contribution
   * @returns
   */
  public async getAvailableCreationSums(
    clientTimezoneOffset: number,
    putThisBack = false,
  ): Promise<Decimal[]> {
    // TODO: move code from getUserCreation and updateCreations inside this function/class
    this.availableCreationSums = await getUserCreation(this.self.userId, clientTimezoneOffset)
    if (putThisBack) {
      this.availableCreationSums = updateCreations(
        this.availableCreationSums,
        this.self,
        clientTimezoneOffset,
      )
    }
    return this.availableCreationSums
  }

  public checkAvailableCreationSumsNotExceeded(
    amount: Decimal,
    creationDate: Date,
    clientTimezoneOffset: number,
  ): void {
    if (!this.availableCreationSums) {
      throw new LogError(
        'missing available creation sums, please call getAvailableCreationSums first',
      )
    }
    // all possible cases not to be true are thrown in this function
    validateContribution(this.availableCreationSums, amount, creationDate, clientTimezoneOffset)
  }
}
