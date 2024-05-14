export enum AccountType {
  NONE = 'NONE', // if no address was found
  COMMUNITY_HUMAN = 'COMMUNITY_HUMAN', // creation account for human
  COMMUNITY_GMW = 'COMMUNITY_GMW', // community public budget account
  COMMUNITY_AUF = 'COMMUNITY_AUF', // community compensation and environment founds account
  COMMUNITY_PROJECT = 'COMMUNITY_PROJECT', // no creations allowed
  SUBACCOUNT = 'SUBACCOUNT', // no creations allowed
  CRYPTO_ACCOUNT = 'CRYPTO_ACCOUNT', // user control his keys, no creations
}
