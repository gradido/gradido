import { Community as DbCommunity } from '../entity/Community'

/**
 * Retrieves the home community, i.e., a community that is not foreign.
 * @returns A promise that resolves to the home community, or null if no home community was found
 */
export async function getHomeCommunity(): Promise<DbCommunity | null> {
  return await DbCommunity.findOne({
    where: { foreign: false },
  })
}