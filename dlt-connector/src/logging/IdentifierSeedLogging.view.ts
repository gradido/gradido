import { IdentifierSeed } from '@/graphql/input/IdentifierSeed'

import { AbstractLoggingView } from './AbstractLogging.view'

export class IdentifierSeedLoggingView extends AbstractLoggingView {
  public constructor(private self: IdentifierSeed) {
    super()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return {
      seed: this.self.seed,
    }
  }
}
