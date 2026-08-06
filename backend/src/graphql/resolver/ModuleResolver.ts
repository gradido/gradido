import { ModuleSettingsInput } from '@input/ModuleSettingsInput'
import { ModuleSettings } from '@model/ModuleSettings'
import { Arg, Authorized, Mutation, Query, Resolver } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { CONFIG } from '@/config'
import { readModuleSettings, writeModuleSettings } from '@/module/settings'

@Resolver()
export class ModuleResolver {
  /**
   * The per-instance module switches for the admin panel. Guarded by the
   * dedicated MODULE_SETTINGS right, which is admin-only: switching a module changes
   * what the whole instance offers, so it is not a moderator's decision.
   */
  @Authorized([RIGHTS.MODULE_SETTINGS])
  @Query(() => ModuleSettings)
  async moduleSettings(): Promise<ModuleSettings> {
    const settings = await readModuleSettings()
    return {
      matchingActive: settings.matchingActive,
      gmsActive: CONFIG.GMS_ACTIVE,
    }
  }

  /**
   * Flips the module switches. Takes effect at once - nothing caches them, and the
   * authorization gate reads them fresh on the next gated request.
   *
   * gmsActive is not settable on purpose: it steers the live transfer to the old
   * gms.gradido.net and stays server config until that is decided separately.
   */
  @Authorized([RIGHTS.MODULE_SETTINGS])
  @Mutation(() => ModuleSettings)
  async setModuleSettings(@Arg('input') input: ModuleSettingsInput): Promise<ModuleSettings> {
    const settings = await writeModuleSettings(input.matchingActive)
    return {
      matchingActive: settings.matchingActive,
      gmsActive: CONFIG.GMS_ACTIVE,
    }
  }
}
