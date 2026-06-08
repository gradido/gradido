#ifndef GRADIDO_BLOCKCHAIN_CORE_MAPPING_DERIVATION_PB_COMPAT_H
#define GRADIDO_BLOCKCHAIN_CORE_MAPPING_DERIVATION_PB_COMPAT_H

#include "gradido_blockchain_core/data/proto/gradido/ledger_metadata.h"
#include "gradido_blockchain_core/types/balance_derivation.h"
#include <assert.h>

#ifdef __cplusplus
extern "C" {
#endif

/*
 * C11 static assert fallback safety
 */
#if !defined(static_assert)
#define static_assert _Static_assert
#endif

/*
 * Ensure pbtools enum == internal enum mapping stays stable.
 *
 * IMPORTANT:
 * If ANY of these fail, protobuf generation or enum ordering changed.
 */

#pragma warning(push)
#pragma warning(disable : 5287)

// UNSPECIFIED
static_assert(
    (int)GRDT_BALANCE_DERIVATION_UNSPECIFIED == (int)proto_gradido_unspecified_e,
    "BalanceDerivation enum mismatch: UNSPECIFIED"
);

// NODE
static_assert(
    (int)GRDT_BALANCE_DERIVATION_NODE == (int)proto_gradido_node_e,
    "BalanceDerivation enum mismatch: NODE"
);

// EXTERN
static_assert(
    (int)GRDT_BALANCE_DERIVATION_EXTERN == (int)proto_gradido_extern_e,
    "CrossGroupType enum mismatch: OUTBOUND"
);

#pragma warning(pop)

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_MAPPING_DERIVATION_PB_COMPAT_H
