// AI-GENERATED — not an architecture reference
import { ModuleSettingsInput } from '@input/ModuleSettingsInput'
import { ActiveModules, ModuleSettings } from '@model/ModuleSettings'
import { dbUpsertModuleSettings } from 'database'
import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { LogError } from '@/server/LogError'
import { getModuleActivation, setModuleActivation } from '@/server/moduleActivation'

@Resolver()
export class ModuleResolver {
  /**
   * Which optional modules this instance offers, for every logged-in member.
   *
   * The wallet needs this to decide whether to show a module at all. Without it the
   * client would have to be told at build time, which is the server-config arrangement
   * the switch replaces - and it would then disagree with the backend until a redeploy.
   */
  @Authorized([RIGHTS.LIST_ACTIVE_MODULES])
  @Query(() => ActiveModules)
  activeModules(): ActiveModules {
    return { matchingActive: getModuleActivation().matchingActive }
  }

  /**
   * The module switches for the admin panel. Guarded by the dedicated MODULE_SETTINGS
   * right, which is admin-only: switching a module changes what the whole instance
   * offers, so it is not a moderator's decision.
   */
  @Authorized([RIGHTS.MODULE_SETTINGS])
  @Query(() => ModuleSettings)
  moduleSettings(): ModuleSettings {
    return {
      matchingActive: getModuleActivation().matchingActive,
      gmsActive: CONFIG.GMS_ACTIVE,
    }
  }

  /**
   * Flips the module switches. Takes effect at once - nothing caches them beyond the
   * request that read them, so the next request sees the new state.
   *
   * gmsActive is not settable on purpose: it steers the live transfer to the old
   * gms.gradido.net and stays server config until that is decided separately. The input
   * type has no field for it, so it cannot be set even by hand.
   */
  @Authorized([RIGHTS.MODULE_SETTINGS])
  @Mutation(() => ModuleSettings)
  async setModuleSettings(@Arg('input') input: ModuleSettingsInput): Promise<ModuleSettings> {
    const written = await dbUpsertModuleSettings(input.matchingActive)
    if (!written.success) {
      // The edge, where an expected failure has to become a response.
      throw new LogError('Could not write the module settings', written.error)
    }
    // What this process holds is stale the moment the row changes, so it is replaced here
    // rather than waited for. The role that isAuthorized narrowed from the old value is
    // deliberately not rebuilt: nothing in this response consults it, and every later
    // check derives the role from the value set on this line.
    setModuleActivation({ matchingActive: written.value })
    return {
      matchingActive: written.value,
      gmsActive: CONFIG.GMS_ACTIVE,
    }
  }
}
