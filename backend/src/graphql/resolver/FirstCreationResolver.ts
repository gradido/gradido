// AI-GENERATED — not an architecture reference
import { FirstCreationEntryInput } from '@input/FirstCreationEntryInput'
import { FirstCreationStatus } from '@model/FirstCreationStatus'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import {
  readFirstCreationStatus,
  skipFirstCreation,
  submitFirstCreation,
} from '@/interactions/firstCreation/FirstCreation.context'
import { Context, getClientTimezoneOffset, getUser } from '@/server/context'
import { LogError } from '@/server/LogError'

/**
 * The GraphQL edge of the first creation. Thin on purpose: the flow is the interaction,
 * this only reads the caller off the context and turns an expected failure into the
 * thrown error the client sees — with the failure's code as the message, no sentence.
 */
@Resolver()
export class FirstCreationResolver {
  @Authorized([RIGHTS.FIRST_CREATION])
  @Query(() => FirstCreationStatus)
  async firstCreationStatus(@Ctx() context: Context): Promise<FirstCreationStatus> {
    return readFirstCreationStatus(getUser(context), getClientTimezoneOffset(context))
  }

  @Authorized([RIGHTS.FIRST_CREATION])
  @Mutation(() => FirstCreationStatus)
  async submitFirstCreation(
    @Arg('entries', () => [FirstCreationEntryInput]) entries: FirstCreationEntryInput[],
    @Ctx() context: Context,
  ): Promise<FirstCreationStatus> {
    const result = await submitFirstCreation(
      getUser(context),
      entries,
      getClientTimezoneOffset(context),
    )
    if (!result.success) {
      throw new LogError(result.error.message)
    }
    return result.value
  }

  @Authorized([RIGHTS.FIRST_CREATION])
  @Mutation(() => Boolean)
  async skipFirstCreation(@Ctx() context: Context): Promise<boolean> {
    await skipFirstCreation(getUser(context))
    return true
  }
}
