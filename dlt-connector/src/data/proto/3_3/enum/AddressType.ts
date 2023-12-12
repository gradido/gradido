export enum AddressType {
  NONE = 0, // if no address was found
  COMMUNITY_HUMAN = 1, // creation account for human
  COMMUNITY_GMW = 2, // community public budget account
  COMMUNITY_AUF = 3, // community compensation and environment founds account
  COMMUNITY_PROJECT = 4, // no creations allowed
  SUBACCOUNT = 5, // no creations allowed
  CRYPTO_ACCOUNT = 6, // user control his keys, no creations
}

export function getAddressTypeEnumValue(typeValue: number | string): AddressType | undefined {
  if (typeof typeValue === 'number') {
    return AddressType[typeValue] as unknown as AddressType
  } else if (typeof typeValue === 'string') {
    // Iterate through all enum values
    for (const key in AddressType) {
      if (AddressType[key] === typeValue) {
        return AddressType[key] as unknown as AddressType
      }
    }
  }
  return undefined // If the string is not found
}
