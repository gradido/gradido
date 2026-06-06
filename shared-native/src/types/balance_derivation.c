#include "gradido_blockchain_core/types/balance_derivation.h"

const char *grdt_balance_derivation_to_string(grdt_balance_derivation balance_derivation) {
  static const char *messages[] = {
      [GRDT_BALANCE_DERIVATION_UNSPECIFIED] = "GRDT_BALANCE_DERIVATION_UNSPECIFIED",
      [GRDT_BALANCE_DERIVATION_NODE] = "GRDT_BALANCE_DERIVATION_NODE",
      [GRDT_BALANCE_DERIVATION_EXTERN] = "GRDT_BALANCE_DERIVATION_EXTERN",
  };

  if (balance_derivation < 0 ||
      balance_derivation >= (int)(sizeof(messages) / sizeof(messages[0]))) {
    return "GRDT_BALANCE_UNKNOWN";
  }

  const char *msg = messages[balance_derivation];
  return msg ? msg : "GRDT_BALANCE_UNKNOWN";
}
