#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_HIERO_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_HIERO_H

#ifdef __cplusplus
extern "C" {
#endif

#include "gradido_blockchain_core/data/timestamp.h"
#include "gradido_blockchain_core/result.h"

#include <stddef.h>
#include <stdint.h>

/** @defgroup grdw_hiero grdw_hiero
 *  @ingroup wire
 *  @brief Hiero blockchain identifiers
 *  @{
 */

/**
 * @brief Hiero account identifier with shard, realm, and account numbers.
 *
 * Represents a unique account identifier in the Hiero blockchain system,
 * composed of shard, realm, and account numbers. The identifier locates
 * an account within the hierarchical address space.
 */
typedef struct grdw_hiero_account_id {
  //! Shard number within the Hiero network.
  int64_t shardNum;
  //!  Realm number within the shard.
  int64_t realmNum;
  //! Account number within the realm.
  int64_t accountNum;
} grdw_hiero_account_id;

int64_t grdw_hiero_account_id_get_shared_num(const grdw_hiero_account_id *hiero_account_id);
int64_t grdw_hiero_account_id_get_realm_num(const grdw_hiero_account_id *hiero_account_id);
int64_t grdw_hiero_account_id_get_account_num(const grdw_hiero_account_id *hiero_account_id);
size_t grdw_hiero_account_id_calculate_string_size(const grdw_hiero_account_id *hiero_account_id);
size_t grdw_hiero_account_id_to_string(
    char *buffer, size_t buffer_size, const grdw_hiero_account_id *hiero_account_id
);

/**
 * @brief Hiero transaction identifier with valid start time and account.
 *
 * Combines a valid start timestamp with an account identifier to uniquely
 * identify a transaction in the Hiero system. The timestamp anchors the
 * transaction in time while the account identifies the initiator.
 */
typedef struct grdw_hiero_transaction_id {
  //! Timestamp marking when the transaction becomes valid.
  grdd_timestamp transactionValidStart;
  //! Account identifier of the transaction initiator.
  grdw_hiero_account_id accountID;
} grdw_hiero_transaction_id;

const grdd_timestamp *grdw_hiero_transaction_id_get_transaction_valid_start(
    const grdw_hiero_transaction_id *hiero_transaction_id
);
const grdw_hiero_account_id *grdw_hiero_transaction_id_get_account_id(
    const grdw_hiero_transaction_id *hiero_transaction_id
);
size_t grdw_hiero_transaction_id_calculate_string_size(
    const grdw_hiero_transaction_id *hiero_transaction_id
);
size_t grdw_hiero_transaction_id_to_string(
    char *buffer, size_t buffer_size, const grdw_hiero_transaction_id *hiero_transaction_id
);

/** @} */

#ifdef __cplusplus
}
#endif

#endif /* GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_HIERO_H */
