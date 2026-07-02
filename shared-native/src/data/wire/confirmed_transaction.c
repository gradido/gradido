#include "gradido_blockchain_core/data/wire/confirmed_transaction.h"
#include "gradido_blockchain_core/data/proto/gradido/confirmed_transaction.h"
#include "gradido_blockchain_core/mapping/pbtools_from_wire.h"
#include "gradido_blockchain_core/mapping/wire_from_pbtools.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"

#include <string.h>

void grdw_confirmed_transaction_init(grdw_confirmed_transaction *tx) {
  memset(tx, 0, sizeof(grdw_confirmed_transaction));
  grdw_gradido_transaction_init(&tx->transaction);
}

grd_result grdw_confirmed_transaction_reserve_account_balances(
    grdw_confirmed_transaction *tx, uint8_t account_balances_count, grd_memory *allocator
) {
  if (!tx || !allocator) { return GRD_ERROR_NULL_POINTER; }
  if (!account_balances_count) { return GRD_ERROR_INVALID_PARAM; }
  grd_result result = grd_memory_buffer_alloc(
      (uint8_t **)&tx->account_balances, allocator,
      sizeof(grdw_account_balance) * account_balances_count
  );
  if (GRD_SUCCESS != result) { return result; }

  tx->account_balances_count = account_balances_count;
  return GRD_SUCCESS;
}

grd_result grdw_confirmed_transaction_copy_account_balance(
    grdw_confirmed_transaction *tx, grdw_account_balance *account_balance, uint8_t index
) {
  if (!tx || !account_balance) { return GRD_ERROR_NULL_POINTER; }
  if (index >= tx->account_balances_count) { return GRD_ERROR_INVALID_PARAM; }
  memcpy(&tx->account_balances[index], account_balance, sizeof(grdw_account_balance));
  return GRD_SUCCESS;
}

grd_result grdw_confirmed_transaction_decode(
    grdw_confirmed_transaction *tx, const grd_memory_block *binary_src, grd_memory *allocator
) {
  if (!tx || !binary_src || !binary_src->data || !allocator) { return GRD_ERROR_NULL_POINTER; }
  if (!binary_src->size) { return GRD_ERROR_INVALID_PARAM; }

  // TODO: calculate needed memory beforhand
  grd_memory_block pbBuffer;
  // take whole static area from allocator for pbtools
  grd_result result = grd_memory_block_alloc(
      &pbBuffer, allocator, allocator->capacity - ALIGN8(allocator->last_index)
  );
  if (GRD_SUCCESS != result) { return result; }

  struct proto_gradido_confirmed_transaction_t *proto_tx;
  proto_tx = proto_gradido_confirmed_transaction_new(pbBuffer.data, pbBuffer.size);
  if (!proto_tx) { return GRD_ERROR_OUT_OF_MEMORY; }
  int resultSize =
      proto_gradido_confirmed_transaction_decode(proto_tx, binary_src->data, binary_src->size);

  // release not from pbtools used part from allocator
  grd_memory_block_free_part(&pbBuffer, allocator, pbBuffer.size - proto_tx->base.heap_p->pos);

  if (PBTOOLS_OUT_OF_MEMORY == -resultSize) { return GRD_ERROR_OUT_OF_MEMORY; }
  if (resultSize != binary_src->size) { return GRD_ERROR_ENCODE_FAILED; }

  result = grdm_confirmed_transaction_from_pb(tx, proto_tx, allocator);
  grd_memory_block_free(&pbBuffer, allocator);
  return result;
}

grd_result grdw_confirmed_transaction_encode(
    grd_memory_block *binary_dst,
    size_t *final_size,
    const grdw_confirmed_transaction *tx,
    grd_memory *allocator
) {
  if (!binary_dst || !tx) { return GRD_ERROR_NULL_POINTER; }
  if (!binary_dst->size) { return GRD_ERROR_INVALID_PARAM; }

  // TODO: replace with more adaptable strategy
  grd_memory_block pbBuffer;
  // take whole static area from allocator for pbtools
  grd_result result = grd_memory_block_alloc(
      &pbBuffer, allocator, allocator->capacity - ALIGN8(allocator->last_index)
  );
  if (GRD_SUCCESS != result) { return result; }

  struct proto_gradido_confirmed_transaction_t *proto_tx;
  proto_tx = proto_gradido_confirmed_transaction_new(pbBuffer.data, pbBuffer.size);
  if (!proto_tx) { return GRD_ERROR_OUT_OF_MEMORY; }

  result = grdm_confirmed_transaction_from_wire(proto_tx, tx);
  if (GRD_SUCCESS != result) { return result; }

  int resultSize =
      proto_gradido_confirmed_transaction_encode(proto_tx, binary_dst->data, binary_dst->size);

  grd_memory_block_free(&pbBuffer, allocator);

  if (PBTOOLS_ENCODE_BUFFER_FULL == -resultSize) { return GRD_ERROR_DESTINATION_BUFFER_TO_SMALL; }
  if (PBTOOLS_OUT_OF_MEMORY == -resultSize) { return GRD_ERROR_OUT_OF_MEMORY; }
  if (resultSize < 0) { return GRD_ERROR_ENCODE_FAILED; }
  if (final_size) { *final_size = resultSize; }
  return GRD_SUCCESS;
}

void grdw_confirmed_transaction_free(grdw_confirmed_transaction *tx, grd_memory *allocator) {
  if (tx->account_balances_count) {
    grd_memory_buffer_free((uint8_t *)tx->account_balances, allocator);
  }
  grdw_gradido_transaction_free(&tx->transaction, allocator);
  grdw_confirmed_transaction_init(tx);
}
