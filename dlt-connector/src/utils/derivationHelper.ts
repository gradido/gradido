export const HARDENED_KEY_BITMASK = 0x80000000
export const GMW_ACCOUNT_DERIVATION_INDEX = 1
export const AUF_ACCOUNT_DERIVATION_INDEX = 2

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
