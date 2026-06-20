#include "gradido_blockchain_core/data/wire/hiero.h"
#include "gradido_blockchain_core/data/timestamp.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/utils/converter.h"

int64_t grdw_hiero_account_id_get_shared_num(const grdw_hiero_account_id *hiero_account_id) {
  if (!hiero_account_id) { return 0; }
  return hiero_account_id->shardNum;
}

int64_t grdw_hiero_account_id_get_realm_num(const grdw_hiero_account_id *hiero_account_id) {
  if (!hiero_account_id) { return 0; }
  return hiero_account_id->realmNum;
}

int64_t grdw_hiero_account_id_get_account_num(const grdw_hiero_account_id *hiero_account_id) {
  if (!hiero_account_id) { return 0; }
  return hiero_account_id->accountNum;
}

size_t grdw_hiero_account_id_calculate_string_size(const grdw_hiero_account_id *hiero_account_id) {
  if (!hiero_account_id) { return 0; }
  return grdu_int64_to_string_size(hiero_account_id->shardNum) +
         grdu_int64_to_string_size(hiero_account_id->realmNum) +
         grdu_int64_to_string_size(hiero_account_id->accountNum) + 2;
}
size_t grdw_hiero_account_id_to_string(
    char *buffer, size_t buffer_size, const grdw_hiero_account_id *hiero_account_id
) {
  if (!buffer || !buffer_size || !hiero_account_id) { return 0; }

  size_t shardNum_size = grdu_int64_to_string_size(hiero_account_id->shardNum);
  size_t realmNum_size = grdu_int64_to_string_size(hiero_account_id->realmNum);
  size_t accountNum_size = grdu_int64_to_string_size(hiero_account_id->accountNum);
  if (buffer_size < shardNum_size + realmNum_size + accountNum_size + 2) {
    return shardNum_size + realmNum_size + accountNum_size + 2;
  }

  grdu_int64_to_string_known_string_size(buffer, hiero_account_id->shardNum, shardNum_size);
  buffer += shardNum_size;
  *buffer = '.';
  buffer++;
  grdu_int64_to_string_known_string_size(buffer, hiero_account_id->realmNum, realmNum_size);
  buffer += realmNum_size;
  *buffer = '.';
  buffer++;
  grdu_int64_to_string_known_string_size(buffer, hiero_account_id->accountNum, accountNum_size);
  return shardNum_size + realmNum_size + accountNum_size + 2;
}

const grdd_timestamp *grdw_hiero_transaction_id_get_transaction_valid_start(
    const grdw_hiero_transaction_id *hiero_transaction_id
) {
  if (!hiero_transaction_id) { return NULL; }
  return &hiero_transaction_id->transactionValidStart;
}

const grdw_hiero_account_id *grdw_hiero_transaction_id_get_account_id(
    const grdw_hiero_transaction_id *hiero_transaction_id
) {
  if (!hiero_transaction_id) { return NULL; }
  return &hiero_transaction_id->accountID;
}

size_t grdw_hiero_transaction_id_calculate_string_size(
    const grdw_hiero_transaction_id *hiero_transaction_id
) {
  if (!hiero_transaction_id) { return 0; }
  return grdw_hiero_account_id_calculate_string_size(&hiero_transaction_id->accountID) +
         grdd_timestamp_calculate_string_size(&hiero_transaction_id->transactionValidStart) + 1;
}

size_t grdw_hiero_transaction_id_to_string(
    char *buffer, size_t buffer_size, const grdw_hiero_transaction_id *hiero_transaction_id
) {
  if (!buffer || !buffer_size || !hiero_transaction_id) { return 0; }

  size_t account_id_size =
      grdw_hiero_account_id_to_string(buffer, buffer_size, &hiero_transaction_id->accountID);
  if (account_id_size > buffer_size) {
    return account_id_size +
           grdd_timestamp_calculate_string_size(&hiero_transaction_id->transactionValidStart);
  }
  buffer += account_id_size;
  buffer_size -= account_id_size;
  *buffer = '@';
  buffer++;
  buffer_size--;
  size_t timestamp_size =
      grdd_timestamp_to_string(buffer, buffer_size, &hiero_transaction_id->transactionValidStart);

  return account_id_size + timestamp_size + 1;
}
