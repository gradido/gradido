import { Resolver, Query, Authorized, Mutation, Args } from 'type-graphql'
import { RIGHTS } from '@/auth/RIGHTS'
import { FdCommunity } from '../model/FdCommunity'
import { readFederationCommunity, readHomeCommunity } from '@/dao/CommunityDAO'
import OpenConnectionArgs from '../arg/OpenConnectionArgs'
import { SecretKeyCryptographyDecrypt } from '@/util/encryptionTools'

@Resolver()
export class FederationResolver {
  @Authorized([RIGHTS.FEDERATE_PUBKEY])
  @Query(() => FdCommunity)
  async getPublicKey(): Promise<string> {
    const fdCom = await readHomeCommunity()
    return fdCom.publicKey
  }

  @Authorized([RIGHTS.FEDERATE_OPEN_CONNECTION])
  @Query(() => [FdCommunity])
  async openConnection(
    @Args()
    { remotePubKey, encryptedSignedRemoteUrl }: OpenConnectionArgs,
  ): Promise<boolean> {
    const homeCom = await readHomeCommunity()
    const decryptedRemoteUrl = SecretKeyCryptographyDecrypt(
      Buffer.from(encryptedSignedRemoteUrl, 'hex'),
      Buffer.from(homeCom.privKey, 'hex'),
    ).toString('hex')

    // TODO hier soll eigentlich direkt return gemacht werden und der Rest läuft asynchron für den Redirect-Aufruf

    const remoteCom = await readFederationCommunity(remotePubKey)
    if (decryptedRemoteUrl === remoteCom.url) {
      // TODO prepare redirect-Request with One-Time-Code
    }

    return true
  }
}
