
#include "gradido_blockchain_core/mapping/wire_from_pbtools.h"
#include "gradido_blockchain_core/mapping/address_pb_compat.h"
#include "gradido_blockchain_core/mapping/balance_derivation_pb_compat.h"
#include "gradido_blockchain_core/mapping/cross_group_pb_compat.h"
#include "gradido_blockchain_core/mapping/ledger_anchor_pb_compat.h"
#include "gradido_blockchain_core/mapping/memo_key_pb_compat.h"

#include <assert.h>
#include <string.h>

#include "gradido_blockchain_core/const.h"
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
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/address.h"
#include "gradido_blockchain_core/types/balance_derivation.h"
#include "gradido_blockchain_core/types/memo_key.h"
#include "gradido_blockchain_core/utils/version.h"

static grd_result community_uuid_from_pbtools(
    uint8_t community_uuid[UUID_BINARY_SIZE], const struct pbtools_bytes_t *bytes
) {
  if (!community_uuid || !bytes) { return GRD_ERROR_NULL_POINTER; }
  if (UUID_BINARY_SIZE == bytes->size) {
    memcpy(community_uuid, bytes->buf_p, UUID_BINARY_SIZE);
  } else if (0 == bytes->size) {
    memset(community_uuid, 0, UUID_BINARY_SIZE);
  } else {
    return GRD_ERROR_INVALID_PARAM;
  }
  return GRD_SUCCESS;
}

static grd_result memory_block_from_pbtools(
    grd_memory_block *dst, const struct pbtools_bytes_t *bytes, grd_memory *allocator
) {
  if (!dst || !bytes || !allocator) { return GRD_ERROR_NULL_POINTER; }
  if (!bytes->size) { return GRD_ERROR_INVALID_PARAM; }
  grd_result result = grd_memory_block_alloc(dst, allocator, bytes->size);
  if (GRD_SUCCESS != result) { return result; }

  memcpy(dst->data, bytes->buf_p, bytes->size);
  return GRD_SUCCESS;
}

static grd_result account_balance_from_pbtools(
    grdw_account_balance *account_balance,
    const struct proto_gradido_account_balance_t *pb_account_balance
) {
  if (!account_balance || !pb_account_balance) { return GRD_ERROR_NULL_POINTER; }
  if (pb_account_balance->pubkey.size != ED25519_PUBLIC_KEY_SIZE) {
    return GRD_ERROR_INVALID_PARAM;
  }
  memcpy(account_balance->pubkey, pb_account_balance->pubkey.buf_p, ED25519_PUBLIC_KEY_SIZE);
  account_balance->balance = pb_account_balance->balance;
  return community_uuid_from_pbtools(
      account_balance->community_uuid, &pb_account_balance->community_uuid
  );
}

static grd_result encrypted_memo_from_pbtools(
    grdw_encrypted_memo *encrypted_memo,
    const struct proto_gradido_encrypted_memo_t *pb_encrypted_memo,
    grd_memory *allocator
) {
  if (!encrypted_memo || !pb_encrypted_memo || !allocator) { return GRD_ERROR_NULL_POINTER; }
  encrypted_memo->type = (grdt_memo_key)pb_encrypted_memo->type;
  if (pb_encrypted_memo->memo.size > 0) {
    return memory_block_from_pbtools(&encrypted_memo->memo, &pb_encrypted_memo->memo, allocator);
  } else {
    encrypted_memo->memo.data = NULL;
    encrypted_memo->memo.size = 0;
  }
  return GRD_SUCCESS;
}

static grd_result signature_pair_from_pbtools(
    grdw_signature_pair *signature_pair,
    const struct proto_gradido_signature_pair_t *pb_signature_pair
) {
  if (!signature_pair || !pb_signature_pair) { return GRD_ERROR_NULL_POINTER; }
  if (pb_signature_pair->pubkey.size != ED25519_PUBLIC_KEY_SIZE ||
      pb_signature_pair->signature.size != ED25519_SIGNATURE_SIZE) {
    return GRD_ERROR_INVALID_PARAM;
  }
  memcpy(signature_pair->public_key, pb_signature_pair->pubkey.buf_p, ED25519_PUBLIC_KEY_SIZE);
  memcpy(signature_pair->signature, pb_signature_pair->signature.buf_p, ED25519_SIGNATURE_SIZE);
  return GRD_SUCCESS;
}

static grd_result timestamp_from_pbtools(
    grdd_timestamp *timestamp, const struct proto_gradido_timestamp_t *pb_timestamp
) {
  if (!timestamp || !pb_timestamp) { return GRD_ERROR_NULL_POINTER; }
  timestamp->nanos = pb_timestamp->nanos;
  timestamp->seconds = pb_timestamp->seconds;
  return GRD_SUCCESS;
}

static grd_result timestamp_seconds_from_pbtools(
    grdw_timestamp_seconds *timestamp_seconds,
    const struct proto_gradido_timestamp_seconds_t *pb_timestamp_seconds
) {
  if (!timestamp_seconds || !pb_timestamp_seconds) { return GRD_ERROR_NULL_POINTER; }
  timestamp_seconds->seconds = pb_timestamp_seconds->seconds;
  return GRD_SUCCESS;
}

static grd_result transfer_amount_from_pbtools(
    grdw_transfer_amount *transfer_amount,
    const struct proto_gradido_transfer_amount_t *pb_transfer_amount
) {
  if (!transfer_amount || !pb_transfer_amount) { return GRD_ERROR_NULL_POINTER; }
  if (pb_transfer_amount->pubkey.size != ED25519_PUBLIC_KEY_SIZE) {
    return GRD_ERROR_INVALID_PARAM;
  }
  memcpy(transfer_amount->pubkey, pb_transfer_amount->pubkey.buf_p, ED25519_PUBLIC_KEY_SIZE);
  transfer_amount->amount = pb_transfer_amount->amount;
  return community_uuid_from_pbtools(
      transfer_amount->community_uuid, &pb_transfer_amount->community_uuid
  );
}

static grd_result hiero_account_id_from_pbtools(
    grdw_hiero_account_id *hiero_account_id,
    const struct proto_gradido_account_id_t *pb_hiero_account_id
) {
  if (!hiero_account_id || !pb_hiero_account_id) { return GRD_ERROR_NULL_POINTER; }
  if (proto_gradido_account_id_account_account_num_e != pb_hiero_account_id->account) {
    return GRD_ERROR_PB_UNHANDLED_ONEOF_BRANCH;
  }
  hiero_account_id->accountNum = pb_hiero_account_id->account_num;
  hiero_account_id->realmNum = pb_hiero_account_id->realm_num;
  hiero_account_id->shardNum = pb_hiero_account_id->shard_num;
  return GRD_SUCCESS;
}

static grd_result hiero_transaction_id_from_pbtools(
    grdw_hiero_transaction_id *hiero_transaction_id,
    const struct proto_gradido_transaction_id_t *pb_hiero_transaction_id
) {
  if (!hiero_transaction_id || !pb_hiero_transaction_id) { return GRD_ERROR_NULL_POINTER; }
  if (pb_hiero_transaction_id->nonce || pb_hiero_transaction_id->scheduled) {
    return GRD_ERROR_PB_UNHANDLED_PARAMETER;
  }
  grd_result result = timestamp_from_pbtools(
      &hiero_transaction_id->transactionValidStart,
      pb_hiero_transaction_id->transaction_valid_start_p
  );
  if (GRD_SUCCESS != result) { return result; }

  return hiero_account_id_from_pbtools(
      &hiero_transaction_id->accountID, pb_hiero_transaction_id->account_id_p
  );
}

static grd_result ledger_anchor_from_pbtools(
    grdw_ledger_anchor *ledger_anchor, const struct proto_gradido_ledger_anchor_t *pb_ledger_anchor
) {
  grd_result result = GRD_ERROR_NOT_INITIALIZED;
  if (!ledger_anchor || !pb_ledger_anchor) { return GRD_ERROR_NULL_POINTER; }

  if (proto_gradido_ledger_anchor_hiero_transaction_id_e == pb_ledger_anchor->type) {
    assert(
        proto_gradido_ledger_anchor_anchor_id_hiero_transaction_id_e == pb_ledger_anchor->anchor_id
    );
    result = hiero_transaction_id_from_pbtools(
        &ledger_anchor->hiero_transaction_id, pb_ledger_anchor->hiero_transaction_id_p
    );
    if (GRD_SUCCESS != result) { return result; }
    ledger_anchor->type = GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID;
  } else {
    ledger_anchor->type = (grdt_ledger_anchor)pb_ledger_anchor->type;
    ledger_anchor->id = pb_ledger_anchor->id;
  }
  return GRD_SUCCESS;
}

static grd_result community_friends_update_from_pbtools(
    grdw_community_friends_update *community_friends_update,
    const struct proto_gradido_community_friends_update_t *pb_community_friends_update
) {
  if (!community_friends_update || !pb_community_friends_update) { return GRD_ERROR_NULL_POINTER; }
  community_friends_update->color_fusion = pb_community_friends_update->color_fusion;
  return GRD_SUCCESS;
}

static grd_result community_root_from_pbtools(
    grdw_community_root *community_root,
    const struct proto_gradido_community_root_t *pb_community_root
) {
  if (!community_root || !pb_community_root) { return GRD_ERROR_NULL_POINTER; }
  if (pb_community_root->pubkey.size != ED25519_PUBLIC_KEY_SIZE ||
      pb_community_root->gmw_pubkey.size != ED25519_PUBLIC_KEY_SIZE ||
      pb_community_root->auf_pubkey.size != ED25519_PUBLIC_KEY_SIZE) {
    return GRD_ERROR_INVALID_PARAM;
  }
  memcpy(community_root->pubkey, pb_community_root->pubkey.buf_p, ED25519_PUBLIC_KEY_SIZE);
  memcpy(community_root->gmw_pubkey, pb_community_root->gmw_pubkey.buf_p, ED25519_PUBLIC_KEY_SIZE);
  memcpy(community_root->auf_pubkey, pb_community_root->auf_pubkey.buf_p, ED25519_PUBLIC_KEY_SIZE);
  return GRD_SUCCESS;
}

static grd_result gradido_creation_from_pbtools(
    grdw_gradido_creation *gradido_creation,
    const struct proto_gradido_gradido_creation_t *pb_gradido_creation
) {
  if (!gradido_creation || !pb_gradido_creation) { return GRD_ERROR_NULL_POINTER; }
  grd_result result = GRD_ERROR_NOT_INITIALIZED;
  result =
      transfer_amount_from_pbtools(&gradido_creation->recipient, pb_gradido_creation->recipient_p);
  if (GRD_SUCCESS != result) { return result; }

  return timestamp_seconds_from_pbtools(
      &gradido_creation->target_date, pb_gradido_creation->target_date_p
  );
}

static grd_result gradido_transfer_from_pbtools(
    grdw_gradido_transfer *gradido_transfer,
    const struct proto_gradido_gradido_transfer_t *pb_gradido_transfer
) {
  if (!gradido_transfer || !pb_gradido_transfer) { return GRD_ERROR_NULL_POINTER; }

  if (pb_gradido_transfer->recipient.size != ED25519_PUBLIC_KEY_SIZE) {
    return GRD_ERROR_INVALID_PARAM;
  }
  memcpy(
      gradido_transfer->recipient, pb_gradido_transfer->recipient.buf_p, ED25519_PUBLIC_KEY_SIZE
  );
  return transfer_amount_from_pbtools(&gradido_transfer->sender, pb_gradido_transfer->sender_p);
  ;
}

static grd_result gradido_deferred_transfer_from_pbtools(
    grdw_gradido_deferred_transfer *gradido_deferred_transfer,
    const struct proto_gradido_gradido_deferred_transfer_t *pb_gradido_deferred_transfer
) {
  if (!gradido_deferred_transfer || !pb_gradido_deferred_transfer) {
    return GRD_ERROR_NULL_POINTER;
  }
  gradido_deferred_transfer->timeout_duration =
      pb_gradido_deferred_transfer->timeout_duration_p->seconds;

  return gradido_transfer_from_pbtools(
      &gradido_deferred_transfer->transfer, pb_gradido_deferred_transfer->transfer_p
  );
}

static grd_result gradido_redeem_deferred_transfer_from_pbtools(
    grdw_gradido_redeem_deferred_transfer *gradido_redeem_deferred_transfer,
    const struct proto_gradido_gradido_redeem_deferred_transfer_t
        *pb_gradido_redeem_deferred_transfer
) {
  if (!gradido_redeem_deferred_transfer || !pb_gradido_redeem_deferred_transfer) {
    return GRD_ERROR_NULL_POINTER;
  }
  grd_result result = GRD_ERROR_NOT_INITIALIZED;
  gradido_redeem_deferred_transfer->deferred_transfer_transaction_nr =
      pb_gradido_redeem_deferred_transfer->deferred_transfer_transaction_nr;

  return gradido_transfer_from_pbtools(
      &gradido_redeem_deferred_transfer->transfer, pb_gradido_redeem_deferred_transfer->transfer_p
  );
}

static grd_result gradido_timeout_deferred_transfer_from_pbtools(
    grdw_gradido_timeout_deferred_transfer *gradido_timeout_deferred_transfer,
    const struct proto_gradido_gradido_timeout_deferred_transfer_t
        *pb_gradido_timeout_deferred_transfer
) {
  if (!gradido_timeout_deferred_transfer || !pb_gradido_timeout_deferred_transfer) {
    return GRD_ERROR_NULL_POINTER;
  }
  gradido_timeout_deferred_transfer->deferred_transfer_transaction_nr =
      pb_gradido_timeout_deferred_transfer->deferred_transfer_transaction_nr;
  return GRD_SUCCESS;
}

static grd_result register_address_from_pbtools(
    grdw_register_address *register_address,
    const struct proto_gradido_register_address_t *pb_register_address
) {
  if (!register_address || !pb_register_address) { return GRD_ERROR_NULL_POINTER; }
  if (pb_register_address->user_pubkey.size != ED25519_PUBLIC_KEY_SIZE ||
      pb_register_address->name_hash.size != BLAKE2B_HASH_SIZE ||
      pb_register_address->account_pubkey.size != ED25519_PUBLIC_KEY_SIZE) {
    return GRD_ERROR_INVALID_PARAM;
  }
  memcpy(
      register_address->user_pubkey, pb_register_address->user_pubkey.buf_p, ED25519_PUBLIC_KEY_SIZE
  );
  register_address->address_type = (grdt_address)pb_register_address->address_type;
  register_address->derivation_index = pb_register_address->derivation_index;
  memcpy(register_address->name_hash, pb_register_address->name_hash.buf_p, BLAKE2B_HASH_SIZE);
  memcpy(
      register_address->account_pubkey, pb_register_address->account_pubkey.buf_p,
      ED25519_PUBLIC_KEY_SIZE
  );
  return GRD_SUCCESS;
}

grd_result grdm_transaction_body_from_pbtools(
    grdw_transaction_body *transaction_body,
    const struct proto_gradido_transaction_body_t *pb_transaction_body,
    grd_memory *allocator
) {
  if (!transaction_body || !pb_transaction_body || !allocator) { return GRD_ERROR_NULL_POINTER; }
  if (GRDU_GRADIDO_PROTOCOL_VERSION != pb_transaction_body->version_number) {
    return GRD_ERROR_PB_INCORRECT_VERSION;
  }
  grd_result result = GRD_ERROR_NOT_INITIALIZED;
  if (pb_transaction_body->memos.length > 0) {
    int memos_count = pb_transaction_body->memos.length;
    if (memos_count >= 255) { return GRD_ERROR_ARRAY_INDEX_OUT_OF_BOUNDS; }

    result = grdw_transaction_body_reserve_memos(transaction_body, memos_count, allocator);
    if (GRD_SUCCESS != result) { return result; }

    grdw_encrypted_memo temp_memo;
    for (uint8_t i = 0; i < memos_count; ++i) {
      // allocate memory for memo, and copy data over from pb struct
      result = encrypted_memo_from_pbtools(
          &temp_memo, &pb_transaction_body->memos.items_p[i], allocator
      );
      if (GRD_SUCCESS != result) { return result; }
      // move allocated memory into gdrw transaction body struct
      result = grdw_transaction_body_move_memo(transaction_body, &temp_memo, i);
      if (GRD_SUCCESS != result) { return result; }
    }
  }
  if (pb_transaction_body->other_community_uuid.size) {
    grd_memory_buffer_alloc(&transaction_body->other_community_uuid, allocator, UUID_BINARY_SIZE);
    result = community_uuid_from_pbtools(
        transaction_body->other_community_uuid, &pb_transaction_body->other_community_uuid
    );
    if (GRD_SUCCESS != result) { return result; }
  }

  result = timestamp_from_pbtools(&transaction_body->created_at, pb_transaction_body->created_at_p);
  if (GRD_SUCCESS != result) { return result; }

  transaction_body->type = (grdt_cross_group)pb_transaction_body->type;

  switch (pb_transaction_body->data) {
  case proto_gradido_transaction_body_data_none_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_NONE;
    return GRD_SUCCESS;
  case proto_gradido_transaction_body_data_transfer_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_TRANSFER;
    return gradido_transfer_from_pbtools(
        &transaction_body->transfer, pb_transaction_body->transfer_p
    );
  case proto_gradido_transaction_body_data_creation_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_CREATION;
    return gradido_creation_from_pbtools(
        &transaction_body->creation, pb_transaction_body->creation_p
    );
  case proto_gradido_transaction_body_data_community_friends_update_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_COMMUNITY_FRIENDS_UPDATE;
    return community_friends_update_from_pbtools(
        &transaction_body->community_friends_update, pb_transaction_body->community_friends_update_p
    );
  case proto_gradido_transaction_body_data_register_address_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_REGISTER_ADDRESS;
    return register_address_from_pbtools(
        &transaction_body->register_address, pb_transaction_body->register_address_p
    );
  case proto_gradido_transaction_body_data_deferred_transfer_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_DEFERRED_TRANSFER;
    return gradido_deferred_transfer_from_pbtools(
        &transaction_body->deferred_transfer, pb_transaction_body->deferred_transfer_p
    );
  case proto_gradido_transaction_body_data_community_root_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_COMMUNITY_ROOT;
    return community_root_from_pbtools(
        &transaction_body->community_root, pb_transaction_body->community_root_p
    );
  case proto_gradido_transaction_body_data_redeem_deferred_transfer_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER;
    return gradido_redeem_deferred_transfer_from_pbtools(
        &transaction_body->redeem_deferred_transfer, pb_transaction_body->redeem_deferred_transfer_p
    );
  case proto_gradido_transaction_body_data_timeout_deferred_transfer_e:
    transaction_body->transaction_type = GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER;
    return gradido_timeout_deferred_transfer_from_pbtools(
        &transaction_body->timeout_deferred_transfer,
        pb_transaction_body->timeout_deferred_transfer_p
    );
  default:
    return GRD_ERROR_ENUM_UNKNOWN;
  }
}

grd_result grdm_gradido_transaction_from_pb(
    grdw_gradido_transaction *tx,
    const struct proto_gradido_gradido_transaction_t *pbtx,
    grd_memory *allocator
) {
  if (!tx || !pbtx) { return GRD_ERROR_NULL_POINTER; }
  grd_result result = GRD_ERROR_NOT_INITIALIZED;
  if (pbtx->sig_map_p && pbtx->sig_map_p->sig_pair.length > 0) {
    int sig_map_count = pbtx->sig_map_p->sig_pair.length;
    if (sig_map_count >= 255) { return GRD_ERROR_ARRAY_INDEX_OUT_OF_BOUNDS; }

    result = grdw_gradido_transaction_reserve_sig_map(tx, sig_map_count, allocator);
    if (GRD_SUCCESS != result) { return result; }

    grdw_signature_pair temp_signature_pair;
    for (int i = 0; i < sig_map_count; ++i) {
      result =
          signature_pair_from_pbtools(&temp_signature_pair, &pbtx->sig_map_p->sig_pair.items_p[i]);
      if (GRD_SUCCESS != result) { return result; }

      result = grdw_gradido_transaction_copy_sig_map(tx, &temp_signature_pair, i);
      if (GRD_SUCCESS != result) { return result; }
    }
  }
  if (pbtx->pairing_ledger_anchor_p) {
    result = ledger_anchor_from_pbtools(&tx->pairing_ledger_anchor, pbtx->pairing_ledger_anchor_p);
    if (GRD_SUCCESS != result) { return result; }
  }

  return memory_block_from_pbtools(&tx->body_bytes, &pbtx->body_bytes, allocator);
}

grd_result grdm_confirmed_transaction_from_pb(
    grdw_confirmed_transaction *confirmed_tx,
    const struct proto_gradido_confirmed_transaction_t *pb_confirmed_tx,
    grd_memory *allocator
) {
  if (!confirmed_tx || !pb_confirmed_tx || !allocator) { return GRD_ERROR_NULL_POINTER; }
  if (GRDU_GRADIDO_PROTOCOL_VERSION != pb_confirmed_tx->version_number) {
    return GRD_ERROR_PB_INCORRECT_VERSION;
  }
  grd_result result = GRD_ERROR_NOT_INITIALIZED;
  confirmed_tx->id = pb_confirmed_tx->id;
  result = grdm_gradido_transaction_from_pb(
      &confirmed_tx->transaction, pb_confirmed_tx->transaction_p, allocator
  );
  if (GRD_SUCCESS != result) { return result; }

  result = timestamp_from_pbtools(&confirmed_tx->confirmed_at, pb_confirmed_tx->confirmed_at_p);
  if (GRD_SUCCESS != result) { return result; }

  if (pb_confirmed_tx->running_hash.size != BLAKE2B_HASH_SIZE) { return GRD_ERROR_INVALID_PARAM; }
  memcpy(confirmed_tx->running_hash, pb_confirmed_tx->running_hash.buf_p, BLAKE2B_HASH_SIZE);

  result =
      ledger_anchor_from_pbtools(&confirmed_tx->ledger_anchor, pb_confirmed_tx->ledger_anchor_p);
  if (GRD_SUCCESS != result) { return result; }

  if (pb_confirmed_tx->account_balances.length > 0) {
    int account_balances_count = pb_confirmed_tx->account_balances.length;
    if (account_balances_count >= 255) { return GRD_ERROR_ARRAY_INDEX_OUT_OF_BOUNDS; }
    result = grdw_confirmed_transaction_reserve_account_balances(
        confirmed_tx, account_balances_count, allocator
    );
    if (GRD_SUCCESS != result) { return result; }

    grdw_account_balance account_balance_test;
    for (int i = 0; i < account_balances_count; i++) {
      result = account_balance_from_pbtools(
          &account_balance_test, &pb_confirmed_tx->account_balances.items_p[i]
      );
      if (GRD_SUCCESS != result) { return result; }

      result =
          grdw_confirmed_transaction_copy_account_balance(confirmed_tx, &account_balance_test, i);
      if (GRD_SUCCESS != result) { return result; }
    }
  }

  confirmed_tx->balance_derivation = (grdt_balance_derivation)pb_confirmed_tx->balance_derivation;
  return GRD_SUCCESS;
}
