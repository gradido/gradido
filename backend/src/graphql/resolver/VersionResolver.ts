import { BackendVersion } from '@model/BackendVersion'
import { Query, Resolver } from 'type-graphql'
import { getBuildInfo } from '@/server/version'

@Resolver()
export class VersionResolver {
  /**
   * Public (no @Authorized): reports the running backend's commit so a backend-only
   * deploy can be verified with a plain POST to /graphql — the frontend/admin bundle
   * hashes cannot show a backend-only deploy. Exposes only the commit SHA (the repo is
   * open source) and the resolution source (git | env | unknown).
   */
  @Query(() => BackendVersion)
  version(): BackendVersion {
    return getBuildInfo()
  }
}
