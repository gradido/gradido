#include "gradido_blockchain_core/data/wire/basic_types.h"

int64_t grdw_account_balance_get_balance(const grdw_account_balance *account_balance) {
  if (!account_balance) { return 0; }
  return account_balance->balance;
}

const uint8_t *grdw_account_balance_get_public_key(const grdw_account_balance *account_balance) {
  if (!account_balance) { return 0; }
  return account_balance->pubkey;
}

const uint8_t *grdw_account_balance_get_community_uuid(
    const grdw_account_balance *account_balance
) {
  if (!account_balance) { return 0; }
  return account_balance->community_uuid;
}
