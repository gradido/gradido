#include "gradido_blockchain_core/data/runtime/complete_transaction.h"
#include "gradido_blockchain_core/data/wire/basic_types.h"
#include "gradido_blockchain_core/data/wire/confirmed_transaction.h"
#include "gradido_blockchain_core/data/wire/transaction_body.h"
#include "gradido_blockchain_core/mapping/runtime_from_wire.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/types/cross_group.h"
#include "gradido_blockchain_core/types/transaction.h"

#include <stdlib.h>
#include <string.h>

grdr_complete_transaction *grdr_complete_transaction_create() {
  grdr_complete_transaction *tx =
      (grdr_complete_transaction *)malloc(sizeof(grdr_complete_transaction));
  if (!tx) return NULL;
  grdr_complete_transaction_init(tx);
  return tx;
}

void grdr_complete_transaction_init(grdr_complete_transaction *tx) {
  if (tx) { memset(tx, 0, sizeof(grdr_complete_transaction)); }
}

void grdr_complete_transaction_release(grdr_complete_transaction *tx) {
  if (tx) {
    grd_memory_free(&tx->memory_area);
    grdr_complete_transaction_init(tx);
  }
}

void grdr_complete_transaction_free(grdr_complete_transaction *tx) {
  if (tx) {
    grdr_complete_transaction_release(tx);
    free(tx);
    tx = NULL;
  }
}

grd_result grdr_complete_transaction_init_from_protobuf(
    grdr_complete_transaction *tx,
    const uint8_t *serialized_data,
    size_t serialized_len,
    const uint8_t community_uuid[16],
    uint8_t *buffer,
    size_t buffer_size
) {
  if (!tx || !serialized_data || !community_uuid || !buffer) { return GRD_ERROR_NULL_POINTER; }
  if (!serialized_len || !buffer_size) { return GRD_ERROR_INVALID_PARAM; }

  grd_memory alloc;
  grd_memory_init_arena_static(&alloc, buffer, buffer_size);

  grdw_confirmed_transaction wire_tx;
  grdw_confirmed_transaction_init(&wire_tx);

  grd_memory_block input_block = {(uint8_t *)serialized_data, serialized_len};
  int result = grdw_confirmed_transaction_decode(&wire_tx, &input_block, &alloc);
  if (result != GRD_SUCCESS) { return result; }

  grdw_transaction_body body;
  grdw_transaction_body_init(&body);
  result = grdw_transaction_body_decode(&body, &wire_tx.transaction.body_bytes, &alloc);
  if (result != GRD_SUCCESS) { return result; }

  grdr_complete_transaction_release(tx);
  return grdm_complete_transaction_from_wire(tx, &body, &wire_tx, community_uuid);
}

const grdw_account_balance *grdr_complete_transaction_get_account_balance_for_public_key(
    const grdr_complete_transaction *tx, const uint8_t public_key[SIGN_PUBLIC_KEY_SIZE]
) {
  if (!tx || !public_key) return NULL;
  for (int i = 0; i < tx->account_balances_count; ++i) {
    const grdw_account_balance *account_balance = &tx->account_balances[i];
    if (0 == memcmp(account_balance->pubkey, public_key, SIGN_PUBLIC_KEY_SIZE)) {
      return account_balance;
    }
  }
  return NULL;
}

const uint8_t *grdr_complete_transaction_get_sender_community_uuid(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return NULL; }

  if (GRDT_CROSS_GROUP_LOCAL == tx->cross_group_type ||
      GRDT_CROSS_GROUP_OUTBOUND == tx->cross_group_type) {
    return tx->tx_community_uuid;
  } else if (GRDT_CROSS_GROUP_INBOUND == tx->cross_group_type) {
    return tx->tx_pairing_community_uuid;
  }
  return NULL;
}

const uint8_t *grdr_complete_transaction_get_recipient_community_uuid(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return NULL; }

  if (GRDT_CROSS_GROUP_LOCAL == tx->cross_group_type ||
      GRDT_CROSS_GROUP_INBOUND == tx->cross_group_type) {
    return tx->tx_community_uuid;
  } else if (GRDT_CROSS_GROUP_OUTBOUND == tx->cross_group_type) {
    return tx->tx_pairing_community_uuid;
  }
  return NULL;
}

const uint8_t *grdr_complete_transaction_get_sender_public_key(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return NULL; }

  if (GRDT_TRANSACTION_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_DEFERRED_TRANSFER == tx->transaction_type) {
    return tx->transfer.sender_pubkey;
  }
  return NULL;
}

const uint8_t *grdr_complete_transaction_get_recipient_public_key(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return NULL; }

  if (GRDT_TRANSACTION_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_DEFERRED_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_CREATION == tx->transaction_type) {
    return tx->transfer.recipient_pubkey;
  }
  return NULL;
}

const uint8_t *grdr_complete_transaction_get_registered_account(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return NULL; }
  if (GRDT_TRANSACTION_REGISTER_ADDRESS == tx->transaction_type) {
    return tx->register_address.account_public_key;
  }
  return NULL;
}

grdt_transaction grdr_complete_transaction_get_transaction_type(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return GRDT_TRANSACTION_NONE; }
  return tx->transaction_type;
}

grdd_unit grdr_complete_transaction_get_amount(const grdr_complete_transaction *tx) {
  if (!tx) { return 0; }
  if (GRDT_TRANSACTION_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_DEFERRED_TRANSFER == tx->transaction_type ||
      GRDT_TRANSACTION_CREATION == tx->transaction_type) {
    return tx->transfer.amount;
  }
  return 0;
}

grdd_timestamp_seconds grdr_complete_transaction_get_target_date(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return 0; }
  if (GRDT_TRANSACTION_CREATION == tx->transaction_type) { return tx->target_date; }
  return 0;
}

grdd_duration_seconds grdr_complete_transaction_get_timeout_duration(
    const grdr_complete_transaction *tx
) {
  if (!tx) { return 0; }
  if (GRDT_TRANSACTION_DEFERRED_TRANSFER == tx->transaction_type) { return tx->timeout_duration; }
  return 0;
}
