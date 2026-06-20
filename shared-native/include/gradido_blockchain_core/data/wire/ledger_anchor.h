
#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_LEDGER_ANCHOR_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_LEDGER_ANCHOR_H

#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/ledger_anchor.h"
#include "hiero.h"

#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grdw_ledger_anchor grdw_ledger_anchor
 *  @ingroup wire
 *  @brief Ledger anchor for linking transactions across systems
 *  @{
 */

/**
 * @brief Ledger anchor with type and union of possible anchor values.
 *
 * Contains a type discriminator and a union holding either a Hiero transaction ID
 * or a legacy numeric ID. The anchor links transactions to their source ledger,
 * providing continuity across different blockchain systems.
 */
typedef struct grdw_ledger_anchor {
  //! Type discriminator indicating which union member is active.
  grdt_ledger_anchor type;
  union {
    //! Hiero transaction identifier (active when type is GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID).
    grdw_hiero_transaction_id hiero_transaction_id;
    //! Legacy numeric ID (active for other anchor types).
    uint64_t id;
  };
} grdw_ledger_anchor;

grdw_ledger_anchor *grdw_ledger_anchor_create();
grdw_ledger_anchor *grdw_ledger_anchor_create_copy(const grdw_ledger_anchor *ledger_anchor);
void grdw_ledger_anchor_free(grdw_ledger_anchor *ledger_anchor);

/**
 * @brief Assemble the ledger anchor with a Hiero transaction ID.
 *
 * Configures the anchor with type GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID and
 * populates the Hiero transaction ID fields from the provided parameters. The
 * anchor links to a specific Hiero transaction through its timestamp and account.
 *
 * @param[in/out] ledger_anchor           Ledger anchor to configure.
 * @param[in]     transaction_valid_start Timestamp when the Hiero transaction becomes valid.
 * @param[in]     account_id_shard_num    Shard number of the Hiero account.
 * @param[in]     account_id_realm_num    Realm number of the Hiero account.
 * @param[in]     account_id_account_num   Account number of the Hiero account.
 */
void grdw_ledger_anchor_assemble_hiero_transaction_id(
    grdw_ledger_anchor *ledger_anchor,
    int64_t transaction_valid_start_seconds,
    int32_t transaction_valid_start_nanos,
    int64_t account_id_shard_num,
    int64_t account_id_realm_num,
    int64_t account_id_account_num
);

/**
 * @brief Set the ledger anchor to a legacy numeric ID.
 *
 * Configures the anchor with the specified type and legacy numeric ID. Used for
 * backward compatibility with older ledger systems that use simple numeric identifiers.
 *
 * @param[in/out] ledger_anchor Ledger anchor to configure.
 * @param[in]     type          Ledger anchor type to set.
 * @param[in]     legacy_id     Legacy numeric identifier.
 * @return                     GRD_SUCCESS on success.
 */
grd_result grdw_ledger_anchor_assemble_legacy_id(
    grdw_ledger_anchor *ledger_anchor, grdt_ledger_anchor type, uint64_t legacy_id
);

/**
 * @brief Set the ledger anchor to a node trigger transaction ID.
 *
 * Configures the anchor with type GRDT_LEDGER_ANCHOR_NODE_TRIGGER_TRANSACTION_ID
 * and the provided numeric ID. Used to link transactions triggered by node events.
 *
 * @param[in/out] ledger_anchor               Ledger anchor to configure.
 * @param[in]     node_trigger_transaction_id Node trigger transaction identifier.
 * @return                                   GRD_SUCCESS on success.
 */
grd_result grdw_ledger_anchor_assemble_node_trigger_transaction_id(
    grdw_ledger_anchor *ledger_anchor, uint64_t node_trigger_transaction_id
);

grdt_ledger_anchor grdw_ledger_anchor_get_type(grdw_ledger_anchor *ledger_anchor);
bool grdw_ledger_anchor_is_legacy(grdw_ledger_anchor *ledger_anchor);
bool grdw_ledger_anchor_is_hiero_transaction_id(grdw_ledger_anchor *ledger_anchor);
bool grdw_ledger_anchor_is_node_trigger_transaction_id(grdw_ledger_anchor *ledger_anchor);

// @return 0 if wrong type for legacy id
uint64_t grdw_ledger_anchor_get_legacy_id(grdw_ledger_anchor *ledger_anchor);
uint64_t grdw_ledger_anchor_get_node_trigger_id(grdw_ledger_anchor *ledger_anchor);

// @return NULL if wrong type hiero transaction id
grdw_hiero_transaction_id *grdw_ledger_anchor_get_hiero_transaction_id(
    grdw_ledger_anchor *ledger_anchor
);

/** @} */

#ifdef __cplusplus
}
#endif

#endif /* GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_LEDGER_ANCHOR_H */
