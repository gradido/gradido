import { MemoryBlock } from 'gradido-blockchain-js'
import * as v from 'valibot'
import {
  Hex32,
  hex32Schema,
  MemoryBlock32,
  memoryBlock32Schema,
  Uuidv4,
} from '../schemas/typeGuard.schema'

/**
 * Uuidv4Hash is a class that represents a uuidv4 BLAKE2b hash
 * to get the hash, the - in the uuidv4 will be removed and the result interpreted as hex string
 * then the hash will be calculated with BLAKE2b algorithm
 * crypto_generichash from libsodium will be called when calling MemoryBlock.calculateHash()
 *
 * This will be used as NameHash for user identification (user uuid as input)
 * This will be used as IotaTopic for transactions (community uuid as input)
 */
export class Uuidv4Hash {
  uuidv4Hash: MemoryBlock32
  // used for caching hex string representation of uuidv4Hash
  uuidv4HashString: Hex32 | undefined

  constructor(uuidv4: Uuidv4) {
    this.uuidv4Hash = v.parse(
      memoryBlock32Schema,
      MemoryBlock.fromHex(uuidv4.replace(/-/g, '')).calculateHash(),
    )
  }

  getAsMemoryBlock(): MemoryBlock32 {
    return this.uuidv4Hash
  }

  getAsHexString(): Hex32 {
    if (!this.uuidv4HashString) {
      this.uuidv4HashString = v.parse(hex32Schema, this.uuidv4Hash)
    }
    return this.uuidv4HashString
  }
}
