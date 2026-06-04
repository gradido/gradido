#include "gradido_blockchain_core/mapping/pbtools_from_wire.h"
#include "gradido_blockchain_core/mapping/address_pb_compat.h"
#include "gradido_blockchain_core/mapping/balance_derivation_pb_compat.h"
#include "gradido_blockchain_core/mapping/cross_group_pb_compat.h"
#include "gradido_blockchain_core/mapping/ledger_anchor_pb_compat.h"
#include "gradido_blockchain_core/mapping/memo_key_pb_compat.h"

#include <pbtools.h>
#include <string.h>

#include "gradido_blockchain_core/data/proto/gradido/basic_types.h"
#include "gradido_blockchain_core/data/proto/gradido/community_friends_update.h"
#include "gradido_blockchain_core/data/proto/gradido/community_root.h"
#include "gradido_blockchain_core/data/proto/gradido/confirmed_transaction.h"
#include "gradido_blockchain_core/data/proto/gradido/gradido_creation.h"
#include "gradido_blockchain_core/data/proto/gradido/gradido_transaction.h"
#include "gradido_blockchain_core/data/proto/gradido/gradido_transfer.h"
#include "gradido_blockchain_core/data/proto/gradido/hiero_basic_types.h"
#include "gradido_blockchain_core/data/proto/gradido/ledger_metadata.h"
#include "gradido_blockchain_core/data/proto/gradido/register_address.h"
#include "gradido_blockchain_core/data/proto/gradido/transaction_body.h"
#include "gradido_blockchain_core/data/timestamp.h"
#include "gradido_blockchain_core/data/wire/basic_types.h"
#include "gradido_blockchain_core/data/wire/confirmed_transaction.h"
#include "gradido_blockchain_core/data/wire/gradido_transaction.h"
#include "gradido_blockchain_core/data/wire/hiero.h"
#include "gradido_blockchain_core/data/wire/ledger_anchor.h"
#include "gradido_blockchain_core/data/wire/specific_transactions.h"
#include "gradido_blockchain_core/data/wire/transaction_body.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/address.h"
#include "gradido_blockchain_core/types/balance_derivation.h"
#include "gradido_blockchain_core/types/memo_key.h"
#include "gradido_blockchain_core/utils/version.h"

/*
 * simply copy ptr to dst, or do nothing if at least one parameter is NULL
 */
static void community_uuid_from_wire(
    struct pbtools_bytes_t *dst, const uint8_t community_uuid[UUID_BINARY_SIZE]
) {
  if (!community_uuid || !dst) { return; }

  dst->buf_p = (uint8_t *)community_uuid;
  dst->size = UUID_BINARY_SIZE;
}
/*
 * simply copy ptr to dst, or do nothing if at least one parameter is NULL
 */
static void memory_block_from_wire(struct pbtools_bytes_t *dst, const grd_memory_block *bytes) {
  if (!dst || !bytes || !bytes->size) { return; }

  dst->buf_p = bytes->data;
  dst->size = bytes->size;
}

static void account_balance_from_wire(
    struct proto_gradido_account_balance_t *pb_account_balance,
    const grdw_account_balance *account_balance
) {
  if (!account_balance || !pb_account_balance) { return; }

  pb_account_balance->pubkey.buf_p = (uint8_t *)account_balance->pubkey;
  pb_account_balance->pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  pb_account_balance->balance = account_balance->balance;

  community_uuid_from_wire(&pb_account_balance->community_uuid, account_balance->community_uuid);
}

static void encrypted_memo_from_wire(
    struct proto_gradido_encrypted_memo_t *pb_encrypted_memo,
    const grdw_encrypted_memo *encrypted_memo
) {
  if (!encrypted_memo || !pb_encrypted_memo) { return; }

  pb_encrypted_memo->type = (enum proto_gradido_encrypted_memo_memo_key_type_e)encrypted_memo->type;

  memory_block_from_wire(&pb_encrypted_memo->memo, &encrypted_memo->memo);
}

static void signature_pair_from_wire(
    struct proto_gradido_signature_pair_t *pb_signature_pair,
    const grdw_signature_pair *signature_pair
) {
  if (!signature_pair || !pb_signature_pair) { return; }

  pb_signature_pair->pubkey.buf_p = (uint8_t *)signature_pair->public_key;
  pb_signature_pair->pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  pb_signature_pair->signature.buf_p = (uint8_t *)signature_pair->signature;
  pb_signature_pair->signature.size = ED25519_SIGNATURE_SIZE;
}

static void timestamp_from_wire(
    struct proto_gradido_timestamp_t *pb_timestamp, const grdd_timestamp *timestamp
) {
  if (!timestamp || !pb_timestamp) { return; }

  pb_timestamp->nanos = timestamp->nanos;
  pb_timestamp->seconds = timestamp->seconds;
}

static void timestamp_seconds_from_wire(
    struct proto_gradido_timestamp_seconds_t *pb_timestamp_seconds,
    const grdw_timestamp_seconds *timestamp_seconds
) {
  if (!timestamp_seconds || !pb_timestamp_seconds) { return; }

  pb_timestamp_seconds->seconds = timestamp_seconds->seconds;
}

static void transfer_amount_from_wire(
    struct proto_gradido_transfer_amount_t *pb_transfer_amount,
    const grdw_transfer_amount *transfer_amount
) {
  if (!transfer_amount || !pb_transfer_amount) { return; }

  pb_transfer_amount->pubkey.buf_p = (uint8_t *)transfer_amount->pubkey;
  pb_transfer_amount->pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  pb_transfer_amount->amount = transfer_amount->amount;

  community_uuid_from_wire(&pb_transfer_amount->community_uuid, transfer_amount->community_uuid);
}

static void hiero_account_id_from_wire(
    struct proto_gradido_account_id_t *pb_hiero_account_id,
    const grdw_hiero_account_id *hiero_account_id
) {
  if (!hiero_account_id || !pb_hiero_account_id) { return; }

  pb_hiero_account_id->account = proto_gradido_account_id_account_account_num_e;
  pb_hiero_account_id->account_num = hiero_account_id->accountNum;
  pb_hiero_account_id->realm_num = hiero_account_id->realmNum;
  pb_hiero_account_id->shard_num = hiero_account_id->shardNum;
}

static grd_result hiero_transaction_id_from_wire(
    struct proto_gradido_transaction_id_t *pb_hiero_transaction_id,
    const grdw_hiero_transaction_id *hiero_transaction_id
) {
  if (!hiero_transaction_id || !pb_hiero_transaction_id) { return GRD_ERROR_NULL_POINTER; }

  pb_hiero_transaction_id->nonce = 0;
  pb_hiero_transaction_id->scheduled = false;
  if (proto_gradido_transaction_id_transaction_valid_start_alloc(pb_hiero_transaction_id)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  timestamp_from_wire(
      pb_hiero_transaction_id->transaction_valid_start_p,
      &hiero_transaction_id->transactionValidStart
  );
  if (proto_gradido_transaction_id_account_id_alloc(pb_hiero_transaction_id)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  hiero_account_id_from_wire(
      pb_hiero_transaction_id->account_id_p, &hiero_transaction_id->accountID
  );
  return GRD_SUCCESS;
}

static grd_result ledger_anchor_from_wire(
    struct proto_gradido_ledger_anchor_t *pb_ledger_anchor, const grdw_ledger_anchor *ledger_anchor
) {
  if (!ledger_anchor || !pb_ledger_anchor) { return GRD_ERROR_NULL_POINTER; }

  if (GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID == ledger_anchor->type) {
    if (proto_gradido_ledger_anchor_hiero_transaction_id_alloc(pb_ledger_anchor)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_ledger_anchor->anchor_id = proto_gradido_ledger_anchor_anchor_id_hiero_transaction_id_e;
    hiero_transaction_id_from_wire(
        pb_ledger_anchor->hiero_transaction_id_p, &ledger_anchor->hiero_transaction_id
    );
    pb_ledger_anchor->type =
        (enum proto_gradido_ledger_anchor_type_e)GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID;
  } else {
    pb_ledger_anchor->anchor_id = proto_gradido_ledger_anchor_anchor_id_id_e;
    pb_ledger_anchor->type = (enum proto_gradido_ledger_anchor_type_e)ledger_anchor->type;
    pb_ledger_anchor->id = ledger_anchor->id;
  }
  return GRD_SUCCESS;
}

static grd_result community_friends_update_from_wire(
    struct proto_gradido_community_friends_update_t *pb_community_friends_update,
    const grdw_community_friends_update *community_friends_update
) {
  if (!community_friends_update || !pb_community_friends_update) { return GRD_ERROR_NULL_POINTER; }

  pb_community_friends_update->color_fusion = community_friends_update->color_fusion;

  return GRD_SUCCESS;
}

static grd_result community_root_from_wire(
    struct proto_gradido_community_root_t *pb_community_root,
    const grdw_community_root *community_root
) {
  if (!community_root || !pb_community_root) { return GRD_ERROR_NULL_POINTER; }

  pb_community_root->pubkey.buf_p = (uint8_t *)community_root->pubkey;
  pb_community_root->pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  pb_community_root->gmw_pubkey.buf_p = (uint8_t *)community_root->gmw_pubkey;
  pb_community_root->gmw_pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  pb_community_root->auf_pubkey.buf_p = (uint8_t *)community_root->auf_pubkey;
  pb_community_root->auf_pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  return GRD_SUCCESS;
}

static grd_result gradido_creation_from_wire(
    struct proto_gradido_gradido_creation_t *pb_gradido_creation,
    const grdw_gradido_creation *gradido_creation
) {
  if (!gradido_creation || !pb_gradido_creation) { return GRD_ERROR_NULL_POINTER; }

  if (proto_gradido_gradido_creation_recipient_alloc(pb_gradido_creation)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  transfer_amount_from_wire(pb_gradido_creation->recipient_p, &gradido_creation->recipient);

  if (proto_gradido_gradido_creation_target_date_alloc(pb_gradido_creation)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  timestamp_seconds_from_wire(pb_gradido_creation->target_date_p, &gradido_creation->target_date);
  return GRD_SUCCESS;
}

static grd_result gradido_transfer_from_wire(
    struct proto_gradido_gradido_transfer_t *pb_gradido_transfer,
    const grdw_gradido_transfer *gradido_transfer
) {
  if (!gradido_transfer || !pb_gradido_transfer) { return GRD_ERROR_NULL_POINTER; }

  pb_gradido_transfer->recipient.buf_p = (uint8_t *)gradido_transfer->recipient;
  pb_gradido_transfer->recipient.size = ED25519_PUBLIC_KEY_SIZE;

  if (proto_gradido_gradido_transfer_sender_alloc(pb_gradido_transfer)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  transfer_amount_from_wire(pb_gradido_transfer->sender_p, &gradido_transfer->sender);
  return GRD_SUCCESS;
}

static grd_result gradido_deferred_transfer_from_wire(
    struct proto_gradido_gradido_deferred_transfer_t *pb_gradido_deferred_transfer,
    const grdw_gradido_deferred_transfer *gradido_deferred_transfer
) {
  if (!gradido_deferred_transfer || !pb_gradido_deferred_transfer) {
    return GRD_ERROR_NULL_POINTER;
  }
  if (proto_gradido_gradido_deferred_transfer_timeout_duration_alloc(
          pb_gradido_deferred_transfer
      )) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  pb_gradido_deferred_transfer->timeout_duration_p->seconds =
      gradido_deferred_transfer->timeout_duration;

  if (proto_gradido_gradido_deferred_transfer_transfer_alloc(pb_gradido_deferred_transfer)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }

  return gradido_transfer_from_wire(
      pb_gradido_deferred_transfer->transfer_p, &gradido_deferred_transfer->transfer
  );
}

static grd_result gradido_redeem_deferred_transfer_from_wire(
    struct proto_gradido_gradido_redeem_deferred_transfer_t *pb_gradido_redeem_deferred_transfer,
    const grdw_gradido_redeem_deferred_transfer *gradido_redeem_deferred_transfer
) {
  if (!gradido_redeem_deferred_transfer || !pb_gradido_redeem_deferred_transfer) {
    return GRD_ERROR_NULL_POINTER;
  }
  grd_result result = GRD_ERROR_NOT_INITIALIZED;
  pb_gradido_redeem_deferred_transfer->deferred_transfer_transaction_nr =
      gradido_redeem_deferred_transfer->deferred_transfer_transaction_nr;
  if (proto_gradido_gradido_redeem_deferred_transfer_transfer_alloc(
          pb_gradido_redeem_deferred_transfer
      )) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  return gradido_transfer_from_wire(
      pb_gradido_redeem_deferred_transfer->transfer_p, &gradido_redeem_deferred_transfer->transfer
  );
}

static grd_result gradido_timeout_deferred_transfer_from_wire(
    struct proto_gradido_gradido_timeout_deferred_transfer_t *pb_gradido_timeout_deferred_transfer,
    const grdw_gradido_timeout_deferred_transfer *gradido_timeout_deferred_transfer
) {
  if (!gradido_timeout_deferred_transfer || !pb_gradido_timeout_deferred_transfer) {
    return GRD_ERROR_NULL_POINTER;
  }
  pb_gradido_timeout_deferred_transfer->deferred_transfer_transaction_nr =
      gradido_timeout_deferred_transfer->deferred_transfer_transaction_nr;
  return GRD_SUCCESS;
}

static grd_result register_address_from_wire(
    struct proto_gradido_register_address_t *pb_register_address,
    const grdw_register_address *register_address
) {
  if (!register_address || !pb_register_address) { return GRD_ERROR_NULL_POINTER; }

  pb_register_address->user_pubkey.buf_p = (uint8_t *)register_address->user_pubkey;
  pb_register_address->user_pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  pb_register_address->address_type =
      (enum proto_gradido_register_address_address_type_e)register_address->address_type;
  pb_register_address->derivation_index = register_address->derivation_index;

  pb_register_address->name_hash.buf_p = (uint8_t *)register_address->name_hash;
  pb_register_address->name_hash.size = BLAKE2B_HASH_SIZE;

  pb_register_address->account_pubkey.buf_p = (uint8_t *)register_address->account_pubkey;
  pb_register_address->account_pubkey.size = ED25519_PUBLIC_KEY_SIZE;

  return GRD_SUCCESS;
}

grd_result grdm_transaction_body_from_wire(
    struct proto_gradido_transaction_body_t *pb_transaction_body,
    const grdw_transaction_body *transaction_body
) {
  if (!transaction_body || !pb_transaction_body) { return GRD_ERROR_NULL_POINTER; }
  pb_transaction_body->version_number = GRDU_GRADIDO_PROTOCOL_VERSION;

  if (transaction_body->memos_count > 0) {
    int memos_count = transaction_body->memos_count;

    if (proto_gradido_transaction_body_memos_alloc(pb_transaction_body, memos_count)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }

    for (uint8_t i = 0; i < memos_count; ++i) {
      encrypted_memo_from_wire(&pb_transaction_body->memos.items_p[i], &transaction_body->memos[i]);
    }
  }

  community_uuid_from_wire(
      &pb_transaction_body->other_community_uuid, transaction_body->other_community_uuid
  );

  if (proto_gradido_transaction_body_created_at_alloc(pb_transaction_body)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  timestamp_from_wire(pb_transaction_body->created_at_p, &transaction_body->created_at);

  pb_transaction_body->type =
      (enum proto_gradido_transaction_body_cross_group_type_e)transaction_body->type;

  switch (transaction_body->transaction_type) {
  case GRDT_TRANSACTION_NONE:
    pb_transaction_body->data = proto_gradido_transaction_body_data_none_e;
    return GRD_SUCCESS;
  case GRDT_TRANSACTION_TRANSFER:
    if (proto_gradido_transaction_body_transfer_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_transfer_e;
    return gradido_transfer_from_wire(pb_transaction_body->transfer_p, &transaction_body->transfer);
  case GRDT_TRANSACTION_CREATION:
    if (proto_gradido_transaction_body_creation_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_creation_e;
    return gradido_creation_from_wire(pb_transaction_body->creation_p, &transaction_body->creation);
  case GRDT_TRANSACTION_COMMUNITY_FRIENDS_UPDATE:
    if (proto_gradido_transaction_body_community_friends_update_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_community_friends_update_e;
    return community_friends_update_from_wire(
        pb_transaction_body->community_friends_update_p, &transaction_body->community_friends_update
    );
  case GRDT_TRANSACTION_REGISTER_ADDRESS:
    if (proto_gradido_transaction_body_register_address_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_register_address_e;
    return register_address_from_wire(
        pb_transaction_body->register_address_p, &transaction_body->register_address
    );
  case GRDT_TRANSACTION_DEFERRED_TRANSFER:
    if (proto_gradido_transaction_body_deferred_transfer_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_deferred_transfer_e;
    return gradido_deferred_transfer_from_wire(
        pb_transaction_body->deferred_transfer_p, &transaction_body->deferred_transfer
    );
  case GRDT_TRANSACTION_COMMUNITY_ROOT:
    if (proto_gradido_transaction_body_community_root_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_community_root_e;
    return community_root_from_wire(
        pb_transaction_body->community_root_p, &transaction_body->community_root
    );
  case GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER:
    if (proto_gradido_transaction_body_redeem_deferred_transfer_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_redeem_deferred_transfer_e;
    return gradido_redeem_deferred_transfer_from_wire(
        pb_transaction_body->redeem_deferred_transfer_p, &transaction_body->redeem_deferred_transfer
    );
  case GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER:
    if (proto_gradido_transaction_body_timeout_deferred_transfer_alloc(pb_transaction_body)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    pb_transaction_body->data = proto_gradido_transaction_body_data_timeout_deferred_transfer_e;
    return gradido_timeout_deferred_transfer_from_wire(
        pb_transaction_body->timeout_deferred_transfer_p,
        &transaction_body->timeout_deferred_transfer
    );
  default:
    return GRD_ERROR_ENUM_UNKNOWN;
  }
}

grd_result grdm_gradido_transaction_from_wire(
    struct proto_gradido_gradido_transaction_t *pbtx, const grdw_gradido_transaction *tx
) {
  if (!tx || !pbtx) { return GRD_ERROR_NULL_POINTER; }

  if (tx->sig_map_count > 0) {
    int sig_map_count = tx->sig_map_count;
    if (sig_map_count >= 255) { return GRD_ERROR_ARRAY_INDEX_OUT_OF_BOUNDS; }
    if (proto_gradido_gradido_transaction_sig_map_alloc(pbtx)) { return GRD_ERROR_OUT_OF_MEMORY; }
    if (proto_gradido_signature_map_sig_pair_alloc(pbtx->sig_map_p, sig_map_count)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }

    for (int i = 0; i < sig_map_count; ++i) {
      signature_pair_from_wire(&pbtx->sig_map_p->sig_pair.items_p[i], &tx->sig_map[i]);
    }
  }

  if (tx->pairing_ledger_anchor.type != GRDT_LEDGER_ANCHOR_UNSPECIFIED) {
    if (proto_gradido_gradido_transaction_pairing_ledger_anchor_alloc(pbtx)) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }
    grd_result result =
        ledger_anchor_from_wire(pbtx->pairing_ledger_anchor_p, &tx->pairing_ledger_anchor);
    if (GRD_SUCCESS != result) { return result; }
  }
  memory_block_from_wire(&pbtx->body_bytes, &tx->body_bytes);
  return GRD_SUCCESS;
}

grd_result grdm_confirmed_transaction_from_wire(
    struct proto_gradido_confirmed_transaction_t *pb_confirmed_tx,
    const grdw_confirmed_transaction *confirmed_tx
) {
  if (!confirmed_tx || !pb_confirmed_tx) { return GRD_ERROR_NULL_POINTER; }

  grd_result result = GRD_ERROR_NOT_INITIALIZED;

  pb_confirmed_tx->version_number = GRDU_GRADIDO_PROTOCOL_VERSION;

  pb_confirmed_tx->id = confirmed_tx->id;

  if (proto_gradido_confirmed_transaction_transaction_alloc(pb_confirmed_tx)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  result = grdm_gradido_transaction_from_wire(
      pb_confirmed_tx->transaction_p, &confirmed_tx->transaction
  );
  if (GRD_SUCCESS != result) { return result; }

  if (proto_gradido_confirmed_transaction_confirmed_at_alloc(pb_confirmed_tx)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  timestamp_from_wire(pb_confirmed_tx->confirmed_at_p, &confirmed_tx->confirmed_at);

  pb_confirmed_tx->running_hash.buf_p = (uint8_t *)confirmed_tx->running_hash;
  pb_confirmed_tx->running_hash.size = BLAKE2B_HASH_SIZE;

  if (proto_gradido_confirmed_transaction_ledger_anchor_alloc(pb_confirmed_tx)) {
    return GRD_ERROR_OUT_OF_MEMORY;
  }
  result = ledger_anchor_from_wire(pb_confirmed_tx->ledger_anchor_p, &confirmed_tx->ledger_anchor);
  if (GRD_SUCCESS != result) { return result; }

  if (confirmed_tx->account_balances_count > 0) {
    int account_balances_count = confirmed_tx->account_balances_count;
    if (account_balances_count >= 255) { return GRD_ERROR_ARRAY_INDEX_OUT_OF_BOUNDS; }
    if (proto_gradido_confirmed_transaction_account_balances_alloc(
            pb_confirmed_tx, account_balances_count
        )) {
      return GRD_ERROR_OUT_OF_MEMORY;
    }

    for (int i = 0; i < account_balances_count; i++) {
      account_balance_from_wire(
          &pb_confirmed_tx->account_balances.items_p[i], &confirmed_tx->account_balances[i]
      );
    }
  }

  pb_confirmed_tx->balance_derivation =
      (enum proto_gradido_balance_derivation_e)confirmed_tx->balance_derivation;
  return GRD_SUCCESS;
}
