#include "gradido_blockchain_core/types/address.h"

const char *grdt_address_to_string(grdt_address address) {
  static const char *messages[] = {
      [GRDT_ADDRESS_NONE] = "GRDT_ADDRESS_NONE",
      [GRDT_ADDRESS_COMMUNITY_HUMAN] = "GRDT_ADDRESS_COMMUNITY_HUMAN",
      [GRDT_ADDRESS_COMMUNITY_GMW] = "GRDT_ADDRESS_COMMUNITY_GMW",
      [GRDT_ADDRESS_COMMUNITY_AUF] = "GRDT_ADDRESS_COMMUNITY_AUF",
      [GRDT_ADDRESS_COMMUNITY_PROJECT] = "GRDT_ADDRESS_COMMUNITY_PROJECT",
      [GRDT_ADDRESS_SUBACCOUNT] = "GRDT_ADDRESS_SUBACCOUNT",
      [GRDT_ADDRESS_CRYPTO_ACCOUNT] = "GRDT_ADDRESS_CRYPTO_ACCOUNT",
      [GRDT_ADDRESS_DEFERRED_TRANSFER] = "GRDT_ADDRESS_DEFERRED_TRANSFER"
  };

  if (address < 0 || address >= (int)(sizeof(messages) / sizeof(messages[0]))) {
    return "GRDT_ADDRESS_UNKNOWN";
  }

  const char *msg = messages[address];
  return msg ? msg : "GRDT_ADDRESS_UNKNOWN";
}
