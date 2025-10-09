import { randomBytes } from 'node:crypto'
import { v4 as uuidv4 } from 'uuid'
import { Community, FederatedCommunity } from '../entity'

export async function createCommunity(foreign: boolean, save: boolean = true): Promise<Community> {
  const community = new Community()
  community.publicKey = randomBytes(32)
  community.communityUuid = uuidv4()
  community.name = 'HomeCommunity-name'
  community.creationDate = new Date()

  if (foreign) {
    community.foreign = true
    community.name = 'ForeignCommunity-name'
    community.description = 'ForeignCommunity-description'
    community.url = `http://foreign-${Math.random()}/api`
    community.authenticatedAt = new Date()
  } else {
    community.foreign = false
    // todo: generate valid public/private key pair (ed25519)
    community.privateKey = randomBytes(64)
    community.name = 'HomeCommunity-name'
    community.description = 'HomeCommunity-description'
    community.url = 'http://localhost/api'
  }
  return save ? await community.save() : community
}

export async function createVerifiedFederatedCommunity(
  apiVersion: string,
  verifiedBeforeMs: number,
  community: Community,
  save: boolean = true,
): Promise<FederatedCommunity> {
  const federatedCommunity = new FederatedCommunity()
  federatedCommunity.apiVersion = apiVersion
  federatedCommunity.endPoint = community.url
  federatedCommunity.publicKey = community.publicKey
  federatedCommunity.community = community
  federatedCommunity.verifiedAt = new Date(Date.now() - verifiedBeforeMs)
  return save ? await federatedCommunity.save() : federatedCommunity
}
