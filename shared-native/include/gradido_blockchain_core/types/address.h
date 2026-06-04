#ifndef GRADIDO_BLOCKCHAIN_CORE_TYPES_ADDRESS_TYPE_H
#define GRADIDO_BLOCKCHAIN_CORE_TYPES_ADDRESS_TYPE_H

#ifdef __cplusplus
extern "C" {
#endif

typedef enum grdt_address {
  GRDT_ADDRESS_NONE = 0,              // if no address was found
  GRDT_ADDRESS_COMMUNITY_HUMAN = 1,   // creation account for human
  GRDT_ADDRESS_COMMUNITY_GMW = 2,     // community public budget account
  GRDT_ADDRESS_COMMUNITY_AUF = 3,     // community compensation and environment founds account
  GRDT_ADDRESS_COMMUNITY_PROJECT = 4, // no creations allowed
  GRDT_ADDRESS_SUBACCOUNT = 5,        // no creations allowed
  GRDT_ADDRESS_CRYPTO_ACCOUNT = 6,    // user control his keys, no creations
  GRDT_ADDRESS_DEFERRED_TRANSFER = 7  // special type, no need for register address
} grdt_address;

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_TYPES_ADDRESS_TYPE_H
