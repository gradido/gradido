import { Resolver, Query, Args } from 'type-graphql'
import { ed25519Address } from '../models/Ed25519Address'
import { GetChildEd25519Args } from '../args/GetChildEd25519Args'
import { Ed25519 } from '../../crypto/Ed25519'

@Resolver()
export class ed25519Resolver {
  @Query(() => ed25519Address)
  async getPrivateChild(
    @Args() { key, chainCode, index }: GetChildEd25519Args,
  ): Promise<ed25519Address> {
    const lib = new Ed25519()
    const result = new ed25519Address()
    const derivedPrivateKey: string = lib.derivePrivateKey(key, chainCode, index)
    result.rootPrivateKey = key
    result.rootPublicKey = lib.getPublicFromPrivateKey(key)
    result.chainCode = chainCode
    result.index = index
    result.privateKey = derivedPrivateKey
    result.publicKey = lib.getPublicFromPrivateKey(derivedPrivateKey)

    return result
  }

  @Query(() => ed25519Address)
  async getPublicChild(
    @Args() { key, chainCode, index }: GetChildEd25519Args,
  ): Promise<ed25519Address> {
    const lib = new Ed25519()
    const result = new ed25519Address()
    const derivedPublicKey = lib.derivePublicKey(key, chainCode, index)
    result.rootPublicKey = key
    result.chainCode = chainCode
    result.index = index
    result.publicKey = derivedPublicKey

    return result
  }
}
