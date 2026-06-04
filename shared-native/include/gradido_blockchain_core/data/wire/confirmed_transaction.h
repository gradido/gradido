#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_CONFIRMED_TRANSACTION_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_CONFIRMED_TRANSACTION_H

#include "basic_types.h"
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/balance_derivation.h"
#include "gradido_transaction.h"
#include "ledger_anchor.h"

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grdw_confirmed_transaction grdw_confirmed_transaction
 *  @ingroup wire
 *  @brief Confirmed transaction with ledger state and account balances
 *  @{
 */

/**
 * @brief Transaction confirmed by the network with ledger state snapshot.
 *
 * Contains the confirmed transaction, its ID, confirmation timestamp, running hash,
 * ledger anchor, and the resulting account balances. The transaction has settled
 * into the blockchain, carrying the state after consensus.
 *
 */
typedef struct grdw_confirmed_transaction {
  //! Unique Transaction Nr of the confirmed transaction (auto increment, without holes)
  uint64_t id;
  //! The gradido transaction that was confirmed
  grdw_gradido_transaction transaction;
  //! Timestamp when the transaction reached consensus in hiero blockchain, may be earlier then
  //! created_at
  grdd_timestamp confirmed_at;
  //! hash of this transaction, including runnning_hash from previous transaction (id - 1 )
  uint8_t running_hash[BLAKE2B_HASH_SIZE];
  //! Ledger anchor linking to the hiero transaction id oder db id on imported legacy transactions
  grdw_ledger_anchor ledger_anchor;
  //! Array of account balances after the transaction applied, account which where changed from this
  //! transaction
  grdw_account_balance *account_balances;
  //! Number of account balance entries in the array.
  uint8_t account_balances_count;
  //! Method used to derive the balance changes. For example extern for legacy but usually node
  grdt_balance_derivation balance_derivation;
} grdw_confirmed_transaction;

/**
 * @brief Initialize a confirmed transaction to a clean, empty state.
 *
 * Sets all pointers to null and numeric fields to zero. The transaction emerges
 * ready to receive its confirmation data and ledger state.
 *
 * @param[out] tx  Confirmed transaction to initialize.
 */
void grdw_confirmed_transaction_init(grdw_confirmed_transaction *tx);

/**
 * @brief Reserve memory for a given number of account balance entries.
 *
 * Allocates an array of account balance pointers using the provided allocator.
 * This must be called before any copy_account_balance operations. The array
 * breathes into existence, holding space for balance snapshots.
 *
 * @param[in/out] tx                       Confirmed transaction to reserve balances in.
 * @param[in]     account_balances_count   Number of balance slots to allocate.
 * @param[in]     allocator                Memory allocator for the pointer array.
 * @return                                 GRD_SUCCESS on success
 *                                         GRD_ERROR_OUT_OF_MEMORY if allocator hasn't enough space
 */
grd_result grdw_confirmed_transaction_reserve_account_balances(
    grdw_confirmed_transaction *tx, uint8_t account_balances_count, grd_memory *allocator
);

/**
 * @brief Copy an account balance into a reserved slot.
 *
 * Deep-copies the account balance structure into the transaction at the specified
 * index. The caller must have called reserve_account_balances first. The allocator
 * is used for the copy.
 *
 * @param[in/out] tx               Confirmed transaction to receive the balance copy.
 * @param[in]     account_balance  Source account balance to copy from.
 * @param[in]     index            Target slot index.
 * @return                         GRD_SUCCESS on success, error code on failure.
 */
grd_result grdw_confirmed_transaction_copy_account_balance(
    grdw_confirmed_transaction *tx, grdw_account_balance *account_balance, uint8_t index
);

/**
 * @brief Decode a confirmed transaction from binary wire format.
 *
 * Parses the binary representation and populates the transaction structure,
 * including the nested gradido transaction, ledger anchor, and all account
 * balances. Requires an area allocator for nested allocations. The binary
 * stream settles into confirmed form.
 *
 * @param[out] tx       Confirmed transaction to populate.
 * @param[in]  binary_src Source memory block containing binary data.
 * @param[in]  allocator Area allocator for nested allocations.
 * @return              GRD_SUCCESS on success
 *                      GRD_ERROR_OUT_OF_MEMORY if allocator hasn't enough space
 * @note                The allocator must be an area allocator; memory is
 *                      not freed individually but as a whole.
 * @whisper             Settlement takes shape
 */
grd_result grdw_confirmed_transaction_decode(
    grdw_confirmed_transaction *tx, const grd_memory_block *binary_src, grd_memory *allocator
);

/**
 * @brief Encode a confirmed transaction into binary wire format.
 *
 * Serializes the confirmed transaction structure, including the gradido
 * transaction, ledger anchor, and all account balances, into a compact binary
 * representation. The encoded form travels across the network, carrying
 * the settled state between nodes.
 *
 * @param[out] binary_dst   Destination memory block for encoded data.
 * @param[out] final_size  Number of bytes written to binary_dst.
 * @param[in]  tx          Confirmed transaction to encode.
 * @param[in]  allocator   Memory allocator for temporary encoding buffers.
 * @return                 GRD_SUCCESS on success
 *                         GRD_ERROR_DESTINATION_BUFFER_TO_SMALL if binary_dst is to small
 *                         GRD_ERROR_OUT_OF_MEMORY if allocator hasn't enough space
 * @whisper                Settlement becomes message
 */
grd_result grdw_confirmed_transaction_encode(
    grd_memory_block *binary_dst,
    size_t *final_size,
    const grdw_confirmed_transaction *tx,
    grd_memory *allocator
);

/**
 * @brief Free all memory owned by a confirmed transaction.
 *
 * Releases the account balances array and any nested allocations within the
 * transaction and ledger anchor. The transaction dissolves back to a clean
 * state, ready for reuse or destruction.
 *
 * @param[in/out] tx        Confirmed transaction to free.
 * @param[in]     allocator Memory allocator used for freeing.
 */
void grdw_confirmed_transaction_free(grdw_confirmed_transaction *tx, grd_memory *allocator);

/** @} */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_CONFIRMED_TRANSACTION_H
