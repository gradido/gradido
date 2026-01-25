#ifndef GRADIDO_BLOCKCHAIN_C_DATA_BALANCE_DERIVATION_TYPE_H
#define GRADIDO_BLOCKCHAIN_C_DATA_BALANCE_DERIVATION_TYPE_H

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @enum grdd_balance_derivation_type
 *
 * Flag to decide if Node calculates balance and decay
 * or trusts external data.
 */
enum grdd_balance_derivation_type {
    GRDD_BALANCE_DERIVATION_UNSPECIFIED = 0,
    /* Balances & decay can be recalculated deterministically */
    GRDD_BALANCE_DERIVATION_NODE        = 1,
    /* Balances are accepted as-is from external / legacy system */
    GRDD_BALANCE_DERIVATION_EXTERN      = 2
};

#ifdef __cplusplus
}
#endif

#endif /* GRADIDO_BLOCKCHAIN_C_DATA_BALANCE_DERIVATION_TYPE_H */
