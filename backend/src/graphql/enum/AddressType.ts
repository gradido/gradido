export enum AddressType {
  NONE = 0, // if no address was found
  HUMAN = 1,
  PROJECT = 2, // no creations allowed
  SUBACCOUNT = 3, // no creations allowed
  CRYPTO_ACCOUNT = 4, // user control his keys, no creations
  COMMUNITY_ACCOUNT = 5, // community control keys, creations allowed
}
