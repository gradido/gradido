#include "gradido_blockchain_core/data/runtime/complete_transaction.h"
#include "gradido_blockchain_core/data/wire/basic_types.h"
#include "gradido_blockchain_core/data/wire/confirmed_transaction.h"
#include "gradido_blockchain_core/data/wire/gradido_transaction.h"
#include "gradido_blockchain_core/data/wire/specific_transactions.h"
#include "gradido_blockchain_core/data/wire/transaction_body.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/types/ledger_anchor.h"
#include <string.h>

static size_t calculate_memory_size(
    const struct grdw_confirmed_transaction *confirmed_tx, const struct grdw_transaction_body *body
) {
  size_t result = 0;
  result += ALIGN8(confirmed_tx->account_balances_count * sizeof(grdw_account_balance));
  if (body->memos_count) {
    result += ALIGN8(body->memos_count * sizeof(grdw_encrypted_memo));
    for (int i = 0; i < body->memos_count; ++i) { result += ALIGN8(body->memos[i].memo.size); }
  }
  if (body->other_community_uuid) { result += UUID_BINARY_SIZE; }
  const grdw_gradido_transaction *transaction = &confirmed_tx->transaction;
  result += ALIGN8(transaction->sig_map_count * sizeof(grdw_signature_pair));

  if (GRDT_LEDGER_ANCHOR_UNSPECIFIED != transaction->pairing_ledger_anchor.type) {
    result += ALIGN8(sizeof(grdw_ledger_anchor));
  }
  result += ALIGN8(transaction->body_bytes.size);
  return result;
}

static void copy_transfer(grdr_complete_transaction *tx, const grdw_gradido_transfer *transfer_tx) {
  if (!tx || !transfer_tx) { return; }
  memcpy(tx->transfer.sender_pubkey, transfer_tx->sender.pubkey, SIGN_PUBLIC_KEY_SIZE);
  memcpy(tx->transfer.recipient_pubkey, transfer_tx->recipient, SIGN_PUBLIC_KEY_SIZE);
  tx->transfer.amount = transfer_tx->sender.amount;
  memcpy(tx->transfer.coin_community_uuid, transfer_tx->sender.community_uuid, UUID_BINARY_SIZE);
}

static void copy_creation(grdr_complete_transaction *tx, const grdw_gradido_creation *creation_tx) {
  if (!tx || !creation_tx) { return; }
  memcpy(tx->transfer.recipient_pubkey, creation_tx->recipient.pubkey, SIGN_PUBLIC_KEY_SIZE);
  tx->transfer.amount = creation_tx->recipient.amount;
  tx->target_date = creation_tx->target_date.seconds;
}

static void copy_register_address(
    grdr_complete_transaction *tx, const grdw_register_address *register_address_tx
) {
  if (!tx || !register_address_tx) { return; }
  memcpy(
      tx->register_address.user_public_key, register_address_tx->user_pubkey, SIGN_PUBLIC_KEY_SIZE
  );
  memcpy(tx->register_address.name_hash, register_address_tx->name_hash, GENERIC_HASH_SIZE);
  memcpy(
      tx->register_address.account_public_key, register_address_tx->account_pubkey,
      SIGN_PUBLIC_KEY_SIZE
  );
  tx->address_type = register_address_tx->address_type;
  tx->derivation_index = register_address_tx->derivation_index;
}

static void copy_deferred_transfer(
    grdr_complete_transaction *tx, const grdw_gradido_deferred_transfer *deferred_transfer_tx
) {
  if (!tx || !deferred_transfer_tx) { return; }
  copy_transfer(tx, &deferred_transfer_tx->transfer);
  tx->timeout_duration = deferred_transfer_tx->timeout_duration;
}

static void copy_redeem_deferred_transfer(
    grdr_complete_transaction *tx,
    const grdw_gradido_redeem_deferred_transfer *redeem_deferred_transfer_tx
) {
  if (!tx || !redeem_deferred_transfer_tx) { return; }
  copy_transfer(tx, &redeem_deferred_transfer_tx->transfer);
  tx->previous_tx = redeem_deferred_transfer_tx->deferred_transfer_transaction_nr;
}

static void copy_timeout_deferred_transfer(
    grdr_complete_transaction *tx,
    const grdw_gradido_timeout_deferred_transfer *timeout_deferred_transfer_tx
) {
  if (!tx || !timeout_deferred_transfer_tx) { return; }
  tx->previous_tx = timeout_deferred_transfer_tx->deferred_transfer_transaction_nr;
}

static void copy_community_root(
    grdr_complete_transaction *tx, const grdw_community_root *community_root
) {
  if (!tx || !community_root) { return; }
  memcpy(tx->community_root.public_key, community_root->pubkey, SIGN_PUBLIC_KEY_SIZE);
  memcpy(tx->community_root.gmw_public_key, community_root->gmw_pubkey, SIGN_PUBLIC_KEY_SIZE);
  memcpy(tx->community_root.auf_public_key, community_root->auf_pubkey, SIGN_PUBLIC_KEY_SIZE);
}

grd_result grdm_complete_transaction_from_wire(
    grdr_complete_transaction *tx,
    const struct grdw_transaction_body *body,
    const struct grdw_confirmed_transaction *confirmed_tx,
    const uint8_t community_uuid[UUID_BINARY_SIZE]
) {
  if (!tx || !confirmed_tx) { return GRD_ERROR_NULL_POINTER; }
  grdr_complete_transaction_release(tx);
  grd_memory_init_arena(&tx->memory_area, calculate_memory_size(confirmed_tx, body));

  tx->tx_nr = confirmed_tx->id;
  tx->confirmed_at = confirmed_tx->confirmed_at;
  tx->created_at = body->created_at;
  memcpy(tx->tx_community_uuid, community_uuid, UUID_BINARY_SIZE);
  tx->ledger_anchor = confirmed_tx->ledger_anchor;

  // sorted by expected frequency of occurrence
  switch (body->transaction_type) {
  case GRDT_TRANSACTION_TRANSFER:
    copy_transfer(tx, &body->transfer);
    break;
  case GRDT_TRANSACTION_CREATION:
    copy_creation(tx, &body->creation);
    break;
  case GRDT_TRANSACTION_REGISTER_ADDRESS:
    copy_register_address(tx, &body->register_address);
    break;
  case GRDT_TRANSACTION_DEFERRED_TRANSFER:
    copy_deferred_transfer(tx, &body->deferred_transfer);
    break;
  case GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER:
    copy_redeem_deferred_transfer(tx, &body->redeem_deferred_transfer);
    break;
  case GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER:
    copy_timeout_deferred_transfer(tx, &body->timeout_deferred_transfer);
    break;
  case GRDT_TRANSACTION_COMMUNITY_ROOT:
    copy_community_root(tx, &body->community_root);
    break;
  default:
    return GRD_ERROR_ENUM_UNHANDLED;
  }

  tx->transaction_type = body->transaction_type;
  tx->balance_derivation_type = confirmed_tx->balance_derivation;
  memcpy(tx->tx_running_hash, confirmed_tx->running_hash, GENERIC_HASH_SIZE);

  grd_result result = GRD_SUCCESS;
  // arrays
  if (confirmed_tx->account_balances_count) {
    result = grd_memory_buffer_copy(
        (uint8_t **)&tx->account_balances, (const uint8_t *)confirmed_tx->account_balances,
        &tx->memory_area, confirmed_tx->account_balances_count * sizeof(grdw_account_balance)
    );
    if (GRD_SUCCESS != result) { return result; }
    tx->account_balances_count = confirmed_tx->account_balances_count;
  }
  if (body->memos_count) {
    result = grd_memory_buffer_alloc(
        (uint8_t **)&tx->encrypted_memos, &tx->memory_area,
        body->memos_count * sizeof(grdw_encrypted_memo)
    );
    if (GRD_SUCCESS != result) { return result; }

    for (int i = 0; i < body->memos_count; ++i) {
      tx->encrypted_memos[i].type = body->memos[i].type;
      result = grd_memory_block_copy(
          &tx->encrypted_memos[i].memo, &body->memos[i].memo, &tx->memory_area
      );
      if (GRD_SUCCESS != result) { return result; }
    }
    tx->encrypted_memos_count = body->memos_count;
  }
  const grdw_gradido_transaction *transaction = &confirmed_tx->transaction;
  if (transaction->sig_map_count) {
    result = grd_memory_buffer_copy(
        (uint8_t **)&tx->signature_pairs, (const uint8_t *)transaction->sig_map, &tx->memory_area,
        transaction->sig_map_count * sizeof(grdw_signature_pair)
    );
    if (GRD_SUCCESS != result) { return result; }
    tx->signature_pairs_count = transaction->sig_map_count;
  }

  tx->cross_group_type = body->type;

  if (body->other_community_uuid) {
    result = grd_memory_buffer_copy(
        (uint8_t **)&tx->tx_pairing_community_uuid, body->other_community_uuid, &tx->memory_area,
        UUID_BINARY_SIZE
    );
    if (GRD_SUCCESS != result) { return result; }
  }

  if (GRDT_LEDGER_ANCHOR_UNSPECIFIED != transaction->pairing_ledger_anchor.type) {
    result = grd_memory_buffer_copy(
        (uint8_t **)&tx->pairing_ledger_anchor,
        (const uint8_t *)&transaction->pairing_ledger_anchor, &tx->memory_area,
        sizeof(grdw_ledger_anchor)
    );
    if (GRD_SUCCESS != result) { return result; }
  }

  return grd_memory_block_copy(&tx->body_bytes, &transaction->body_bytes, &tx->memory_area);
}
