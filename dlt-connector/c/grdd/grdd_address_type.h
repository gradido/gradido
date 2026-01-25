#ifndef __GRADIDO_BLOCKCHAIN_C_DATA_ADDRESS_TYPE_H
#define __GRADIDO_BLOCKCHAIN_C_DATA_ADDRESS_TYPE_H

#ifdef __cplusplus
extern "C" {
#endif

enum grdd_address_type {
    GRDD_ADDRESS_TYPE_NONE = 0, // if no address was found
    GRDD_ADDRESS_TYPE_COMMUNITY_HUMAN = 1, // creation account for human
    GRDD_ADDRESS_TYPE_COMMUNITY_GMW = 2, // community public budget account
    GRDD_ADDRESS_TYPE_COMMUNITY_AUF = 3, // community compensation and environment founds account
    GRDD_ADDRESS_TYPE_COMMUNITY_PROJECT = 4, // no creations allowed
    GRDD_ADDRESS_TYPE_SUBACCOUNT = 5, // no creations allowed
    GRDD_ADDRESS_TYPE_CRYPTO_ACCOUNT = 6, // user control his keys, no creations
    GRDD_ADDRESS_TYPE_DEFERRED_TRANSFER = 7 // special type, no need for register address
};

#ifdef __cplusplus
}
#endif

#endif //__GRADIDO_BLOCKCHAIN_C_DATA_ADDRESS_TYPE_H