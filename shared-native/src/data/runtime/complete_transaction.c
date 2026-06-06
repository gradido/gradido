#include "gradido_blockchain_core/data/runtime/complete_transaction.h"
#include "gradido_blockchain_core/data/wire/basic_types.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/types/cross_group.h"
#include <string.h>

void grdr_complete_transaction_init(grdr_complete_transaction *tx) {
  if (tx) { memset(tx, 0, sizeof(grdr_complete_transaction)); }
}

void grdr_complete_transaction_release(grdr_complete_transaction *tx) {
  if (tx) {
    grd_memory_free(&tx->memory_area);
    grdr_complete_transaction_init(tx);
  }
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
