#ifndef GRADIDO_BLOCKCHAIN_CORE_TYPES_BALANCE_DERIVATION_H
#define GRADIDO_BLOCKCHAIN_CORE_TYPES_BALANCE_DERIVATION_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @enum grdt_balance_derivation
 *
 * Flag to decide if Node calculates balance and decay
 * or trusts external data.
 */
typedef enum grdt_balance_derivation {
  GRDT_BALANCE_DERIVATION_UNSPECIFIED = 0,
  /* Balances & decay can be recalculated deterministically */
  GRDT_BALANCE_DERIVATION_NODE = 1,
  /* Balances are accepted as-is from external / legacy system */
  GRDT_BALANCE_DERIVATION_EXTERN = 2
} grdt_balance_derivation;

const char *grdt_balance_derivation_to_string(grdt_balance_derivation balance_derivation);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_TYPES_BALANCE_DERIVATION_H
