#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_RUNTIME_COMPLETE_TRANSACTION_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_RUNTIME_COMPLETE_TRANSACTION_H

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/data/timestamp.h"
#include "gradido_blockchain_core/data/types.h"
#include "gradido_blockchain_core/data/wire/basic_types.h"
#include "gradido_blockchain_core/data/wire/ledger_anchor.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/address.h"
#include "gradido_blockchain_core/types/balance_derivation.h"
#include "gradido_blockchain_core/types/cross_group.h"
#include "gradido_blockchain_core/types/transaction.h"

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct grdr_complete_transaction {
  uint64_t tx_nr;
  grdd_timestamp confirmed_at;
  grdd_timestamp created_at;
  uint8_t tx_community_uuid[UUID_BINARY_SIZE];
  grdw_ledger_anchor ledger_anchor;

  // --- Transaction Detail Data ---
  // Access based on 'transaction_type' (see end of struct):
  //   GRDT_TRANSACTION_CREATION                   -> transfer
  //   GRDT_TRANSACTION_TRANSFER                   -> transfer
  //   GRDT_TRANSACTION_DEFERRED_TRANSFER          -> transfer
  //   GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER   -> transfer
  //   GRDT_TRANSACTION_REGISTER_ADDRESS           -> register_address
  //   GRDT_TRANSACTION_COMMUNITY_ROOT             -> community_root
  union {
    struct {
      uint8_t sender_pubkey[SIGN_PUBLIC_KEY_SIZE]; // set to 00000... on creation tx
      uint8_t recipient_pubkey[SIGN_PUBLIC_KEY_SIZE];
      grdd_unit amount;
      uint8_t coin_community_uuid[UUID_BINARY_SIZE];
    } transfer;
    struct {
      uint8_t user_public_key[SIGN_PUBLIC_KEY_SIZE];
      uint8_t name_hash[GENERIC_HASH_SIZE];
      uint8_t account_public_key[SIGN_PUBLIC_KEY_SIZE];
    } register_address;
    struct {
      uint8_t public_key[SIGN_PUBLIC_KEY_SIZE];
      uint8_t gmw_public_key[SIGN_PUBLIC_KEY_SIZE];
      uint8_t auf_public_key[SIGN_PUBLIC_KEY_SIZE];
    } community_root;
  };

  // --- Transaction Context Data ---
  // Access based on 'transaction_type' (see end of struct):
  //   GRDT_TRANSACTION_CREATION                      -> target_date (not more than 2 months from
  //   created_at) GRDT_TRANSACTION_DEFERRED_TRANSFER -> timeout_duration
  //   GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER      -> previous_tx
  //   GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER     -> previous_tx
  //   GRDT_TRANSACTION_REGISTER_ADDRESS              -> address_type, derivation_index
  union {
    // target_date for creation gdd per month max calculation, not more than 2 months away from
    // create_at for creation transactions
    grdd_timestamp_seconds target_date;
    // timeout in seconds for deferred transfer
    grdd_duration_seconds timeout_duration;
    uint64_t previous_tx;
    struct {
      grdt_address address_type;
      uint32_t derivation_index;
    };
  };

  grdt_transaction transaction_type;
  grdt_balance_derivation balance_derivation_type;
  uint8_t tx_running_hash[GENERIC_HASH_SIZE];

  // arrays
  grdw_account_balance *account_balances;
  size_t account_balances_count;
  grdw_encrypted_memo *encrypted_memos;
  size_t encrypted_memos_count;
  grdw_signature_pair *signature_pairs;
  size_t signature_pairs_count;

  // --- Cross-Group Data and Type ---
  // if not GRDT_CROSS_GROUP_LOCAL, following parameters may be set
  grdt_cross_group cross_group_type;
  uint8_t *tx_pairing_community_uuid;        // null on local txs
  grdw_ledger_anchor *pairing_ledger_anchor; // null on local txs

  // transaction body as protobuf serialization, payload for signature
  grd_memory_block body_bytes;

  // contains memory used for all pointer in this obj
  grd_memory memory_area;

} grdr_complete_transaction;

typedef struct grdr_transaction_party grdr_transaction_party;

// will malloc memory for grdr_complete_transaction, for using with FFI
grdr_complete_transaction *grdr_complete_transaction_create();

// will set everything to null
void grdr_complete_transaction_init(grdr_complete_transaction *tx);
// will release memory and call init to set everything to null
void grdr_complete_transaction_release(grdr_complete_transaction *tx);
// call grdr_complete_transaction_release and will free memory where tx is pointing
void grdr_complete_transaction_free(grdr_complete_transaction *tx);

grd_result grdr_complete_transaction_init_from_protobuf(
    grdr_complete_transaction *tx,
    const uint8_t *serialized_data,
    size_t serialized_len,
    const uint8_t community_uuid[16],
    uint8_t *buffer,
    size_t buffer_size
);

const grdw_account_balance *grdr_complete_transaction_get_account_balance_for_public_key(
    const grdr_complete_transaction *tx, const uint8_t public_key[SIGN_PUBLIC_KEY_SIZE]
);
/**
 * @param return: pointer to 16 Byte Array with uuid or NULL
 */
const uint8_t *grdr_complete_transaction_get_sender_community_uuid(
    const grdr_complete_transaction *tx
);

/**
 * @param return: pointer to 16 Byte Array with uuid or NULL
 */
const uint8_t *grdr_complete_transaction_get_recipient_community_uuid(
    const grdr_complete_transaction *tx
);

/**
 * @param return: pointer to 32 Byte Array with public key or NULL
 */
const uint8_t *grdr_complete_transaction_get_sender_public_key(const grdr_complete_transaction *tx);

/**
 * @param return: pointer to 32 Byte Array with public key or NULL
 */
const uint8_t *grdr_complete_transaction_get_recipient_public_key(
    const grdr_complete_transaction *tx
);

const uint8_t *grdr_complete_transaction_get_registered_account(
    const grdr_complete_transaction *tx
);

grdt_transaction grdr_complete_transaction_get_transaction_type(
    const grdr_complete_transaction *tx
);

grdd_unit grdr_complete_transaction_get_amount(const grdr_complete_transaction *tx);

grdd_timestamp_seconds grdr_complete_transaction_get_target_date(
    const grdr_complete_transaction *tx
);
grdd_duration_seconds grdr_complete_transaction_get_timeout_duration(
    const grdr_complete_transaction *tx
);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_DATA_RUNTIME_COMPLETE_TRANSACTION_H
