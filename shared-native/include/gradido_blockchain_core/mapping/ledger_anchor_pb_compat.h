#ifndef GRADIDO_BLOCKCHAIN_CORE_MAPPING_LEDGER_ANCHOT_PB_COMPAT_H
#define GRADIDO_BLOCKCHAIN_CORE_MAPPING_LEDGER_ANCHOT_PB_COMPAT_H

#include "gradido_blockchain_core/data/proto/gradido/ledger_metadata.h"
#include "gradido_blockchain_core/data/wire/ledger_anchor.h"
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

/* UNSPECIFIED */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_UNSPECIFIED == (int)proto_gradido_ledger_anchor_unspecified_e,
    "LedgerAnchor enum mismatch: UNSPECIFIED"
);

/* HIERO_TRANSACTION_ID */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID ==
        (int)proto_gradido_ledger_anchor_hiero_transaction_id_e,
    "LedgerAnchor enum mismatch: HIERO_TRANSACTION_ID"
);

/* LEGACY_GRADIDO_DB_TRANSACTION_ID */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_ID ==
        (int)proto_gradido_ledger_anchor_legacy_gradido_db_transaction_id_e,
    "LedgerAnchor enum mismatch: LEGACY_TRANSACTION_ID"
);

/* NODE_TRIGGER_TRANSACTION_ID */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_NODE_TRIGGER_TRANSACTION_ID ==
        (int)proto_gradido_ledger_anchor_node_trigger_transaction_id_e,
    "LedgerAnchor enum mismatch: NODE_TRIGGER_TRANSACTION_ID"
);

/* LEGACY_GRADIDO_DB_COMMUNITY_ID */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_COMMUNITY_ID ==
        (int)proto_gradido_ledger_anchor_legacy_gradido_db_community_id_e,
    "LedgerAnchor enum mismatch: LEGACY_COMMUNITY_ID"
);

/* LEGACY_GRADIDO_DB_USER_ID */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_USER_ID ==
        (int)proto_gradido_ledger_anchor_legacy_gradido_db_user_id_e,
    "LedgerAnchor enum mismatch: LEGACY_USER_ID"
);

/* LEGACY_GRADIDO_DB_CONTRIBUTION_ID */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_CONTRIBUTION_ID ==
        (int)proto_gradido_ledger_anchor_legacy_gradido_db_contribution_id_e,
    "LedgerAnchor enum mismatch: LEGACY_CONTRIBUTION_ID"
);

/* LEGACY_GRADIDO_DB_TRANSACTION_LINK_ID */
static_assert(
    (int)GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_LINK_ID ==
        (int)proto_gradido_ledger_anchor_legacy_gradido_db_transaction_link_id_e,
    "LedgerAnchor enum mismatch: LEGACY_TRANSACTION_LINK_ID"
);

#pragma warning(pop)

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_MAPPING_LEDGER_ANCHOT_PB_COMPAT_H
