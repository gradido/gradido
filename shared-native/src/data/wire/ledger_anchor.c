#include "gradido_blockchain_core/data/wire/ledger_anchor.h"
#include "gradido_blockchain_core/data/timestamp.h"
#include "gradido_blockchain_core/types/ledger_anchor.h"

#include <stdlib.h>
#include <string.h>

grdw_ledger_anchor *grdw_ledger_anchor_create() {
  grdw_ledger_anchor *ledger_anchor = (grdw_ledger_anchor *)malloc(sizeof(grdw_ledger_anchor));
  memset(ledger_anchor, 0, sizeof(grdw_ledger_anchor));
  return ledger_anchor;
}

grdw_ledger_anchor *grdw_ledger_anchor_create_copy(const grdw_ledger_anchor *ledger_anchor_input) {
  grdw_ledger_anchor *ledger_anchor = (grdw_ledger_anchor *)malloc(sizeof(grdw_ledger_anchor));
  memcpy(ledger_anchor, ledger_anchor_input, sizeof(grdw_ledger_anchor));
  return ledger_anchor;
}

void grdw_ledger_anchor_free(grdw_ledger_anchor *ledger_anchor) {
  if (ledger_anchor) { free(ledger_anchor); }
}

grd_result grdw_ledger_anchor_set_hiero_transaction_id(
    grdw_ledger_anchor *ledger_anchor,
    grdd_timestamp transaction_valid_start,
    int64_t account_id_shard_num,
    int64_t account_id_realm_num,
    int64_t account_id_account_num
) {
  if (!ledger_anchor) { return GRD_ERROR_NULL_POINTER; }
  ledger_anchor->type = GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID;
  ledger_anchor->hiero_transaction_id = (grdw_hiero_transaction_id){
      .transactionValidStart = transaction_valid_start,
      .accountID = (grdw_hiero_account_id){
          .shardNum = account_id_shard_num,
          .realmNum = account_id_realm_num,
          .accountNum = account_id_account_num
      }
  };
  return GRD_SUCCESS;
}

grd_result grdw_ledger_anchor_set_legacy_id(
    grdw_ledger_anchor *ledger_anchor, grdt_ledger_anchor type, uint64_t legacy_id
) {
  if (!ledger_anchor) { return GRD_ERROR_NULL_POINTER; }
  if (GRDT_LEDGER_ANCHOR_UNSPECIFIED == type || GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID == type ||
      GRDT_LEDGER_ANCHOR_NODE_TRIGGER_TRANSACTION_ID == type) {
    return GRD_ERROR_INVALID_ENUM_TYPE;
  }
  ledger_anchor->type = type;
  ledger_anchor->id = legacy_id;

  return GRD_SUCCESS;
}

grd_result grdw_ledger_anchor_set_node_trigger_transaction_id(
    grdw_ledger_anchor *ledger_anchor, uint64_t node_trigger_transaction_id
) {
  if (!ledger_anchor) { return GRD_ERROR_NULL_POINTER; }
  ledger_anchor->type = GRDT_LEDGER_ANCHOR_NODE_TRIGGER_TRANSACTION_ID;
  ledger_anchor->id = node_trigger_transaction_id;

  return GRD_SUCCESS;
}

grdt_ledger_anchor grdw_ledger_anchor_get_type(grdw_ledger_anchor *ledger_anchor) {
  if (!ledger_anchor) { return GRDT_LEDGER_ANCHOR_UNSPECIFIED; }
  return ledger_anchor->type;
}

bool grdw_ledger_anchor_is_legacy(grdw_ledger_anchor *ledger_anchor) {
  if (!ledger_anchor) { return false; }
  return GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_ID == ledger_anchor->type ||
         GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_COMMUNITY_ID == ledger_anchor->type ||
         GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_USER_ID == ledger_anchor->type ||
         GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_CONTRIBUTION_ID == ledger_anchor->type ||
         GRDT_LEDGER_ANCHOR_LEGACY_GRADIDO_DB_TRANSACTION_LINK_ID == ledger_anchor->type;
}

bool grdw_ledger_anchor_is_hiero_transaction_id(grdw_ledger_anchor *ledger_anchor) {
  if (!ledger_anchor) { return false; }
  return GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID == ledger_anchor->type;
}

bool grdw_ledger_anchor_is_node_trigger_transaction_id(grdw_ledger_anchor *ledger_anchor) {
  if (!ledger_anchor) { return false; }
  return GRDT_LEDGER_ANCHOR_NODE_TRIGGER_TRANSACTION_ID == ledger_anchor->type;
}

// @return 0 if wrong type for legacy id
uint64_t grdw_ledger_anchor_get_legacy_id(grdw_ledger_anchor *ledger_anchor) {
  if (!grdw_ledger_anchor_is_legacy(ledger_anchor)) { return 0; }
  return ledger_anchor->id;
}

uint64_t grdw_ledger_anchor_get_node_trigger_id(grdw_ledger_anchor *ledger_anchor) {
  if (!grdw_ledger_anchor_is_node_trigger_transaction_id(ledger_anchor)) { return 0; }
  return ledger_anchor->id;
}

// @return NULL if wrong type hiero transaction id
grdw_hiero_transaction_id *grdw_ledger_anchor_get_hiero_transaction_id(
    grdw_ledger_anchor *ledger_anchor
) {
  if (!grdw_ledger_anchor_is_hiero_transaction_id(ledger_anchor)) { return NULL; }
  return &ledger_anchor->hiero_transaction_id;
}
