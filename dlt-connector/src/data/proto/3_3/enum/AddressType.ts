/**
 * Enum for protobuf
 * used from RegisterAddress to determine account type
 * master implementation: https://github.com/gradido/gradido_protocol/blob/master/proto/gradido/register_address.proto
 */
export enum AddressType {
  NONE = 0, // if no address was found
  COMMUNITY_HUMAN = 1, // creation account for human
  COMMUNITY_GMW = 2, // community public budget account
  COMMUNITY_AUF = 3, // community compensation and environment founds account
  COMMUNITY_PROJECT = 4, // no creations allowed
  SUBACCOUNT = 5, // no creations allowed
  CRYPTO_ACCOUNT = 6, // user control his keys, no creations
}
