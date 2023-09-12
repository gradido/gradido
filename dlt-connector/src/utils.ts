export const uuid4ToBuffer = (uuid: string): Buffer => {
  // Remove dashes from the UUIDv4 string
  const cleanedUUID = uuid.replace(/-/g, '')

  // Create a Buffer object from the hexadecimal values
  const buffer = Buffer.from(cleanedUUID, 'hex')

  return buffer
}

export const HARDENED_KEY_BITMASK = 0x80000000

/*
 * change derivation index from x => x'
 * for more infos to hardened keys look here:
 * https://en.bitcoin.it/wiki/BIP_0032
 */
export const hardenDerivationIndex = (derivationIndex: number): number => {
  /*
  TypeScript uses signed integers by default, 
  but bip32-ed25519 expects an unsigned value for the derivation index.
  The >>> shifts the bits 0 places to the right, which effectively makes no change to the value, 
  but forces TypeScript to treat derivationIndex as an unsigned value.  
  Source: ChatGPT
  */
  return (derivationIndex | HARDENED_KEY_BITMASK) >>> 0
}
