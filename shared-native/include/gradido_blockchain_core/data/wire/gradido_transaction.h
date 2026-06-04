#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_GRADIDO_TRANSACTION_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_GRADIDO_TRANSACTION_H

#include "basic_types.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"
#include "ledger_anchor.h"

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grdw_gradido_transaction grdw_gradido_transaction
 *  @ingroup wire
 *  @brief Gradido transaction with signatures and body bytes
 *  @{
 */

/**
 * @brief Gradido transaction with signature map and serialized body.
 *
 * Contains an array of signature pairs, the serialized transaction body bytes,
 * a pairing ledger anchor for cross-group transactions, and the signature count.
 * The transaction carries authorization through signatures and the signed body as raw bytes.
 */
typedef struct grdw_gradido_transaction {
  //!  Array of signature pairs, allocated via reserve_sig_map.
  grdw_signature_pair *sig_map;
  //! Protobuf Serialized transaction body as a memory block, payload of signature
  grd_memory_block body_bytes;
  //! Ledger anchor for pairing transaction by cross-group transactions
  grdw_ledger_anchor pairing_ledger_anchor;
  //! Number of signature pairs in the array.
  uint8_t sig_map_count;
} grdw_gradido_transaction;

/**
 * @brief Initialize a gradido transaction to a clean, empty state.
 *
 * Sets all pointers to null and numeric fields to zero. The transaction emerges
 * ready to receive its signatures and body bytes.
 *
 * @param[out] tx  Gradido transaction to initialize.
 */
void grdw_gradido_transaction_init(grdw_gradido_transaction *tx);

/**
 * @brief Reserve memory for a given number of signature pairs.
 *
 * Allocates an array of signature pair pointers using the provided allocator.
 * This must be called before any copy_sig_map operations. The array breathes
 * into existence, holding space for authorizations.
 *
 * @param[in/out] tx            Gradido transaction to reserve signatures in.
 * @param[in]     sig_map_count Number of signature slots to allocate. Max 255.
 * @param[in]     allocator     Memory allocator for the pointer array.
 * @return                      GRD_SUCCESS on success, GRD_ERROR_OUT_OF_MEMORY if allocator
 *                              hasn't enough space.
 */
grd_result grdw_gradido_transaction_reserve_sig_map(
    grdw_gradido_transaction *tx, uint8_t sig_map_count, grd_memory *allocator
);

/**
 * @brief Copy a signature pair into a reserved slot.
 *
 * Deep-copies the signature pair structure into the transaction at the specified
 * index. The caller must have called reserve_sig_map first. The allocator is used
 * for the copy.
 *
 * @param[in/out] tx       Gradido transaction to receive the signature copy.
 * @param[in]     sig_map  Source signature pair to copy from.
 * @param[in]     index    Target slot index.
 * @return                GRD_SUCCESS on success, GRD_ERROR_OUT_OF_MEMORY if allocator
 *                        hasn't enough space.
 */
grd_result grdw_gradido_transaction_copy_sig_map(
    grdw_gradido_transaction *tx, const grdw_signature_pair *sig_map, uint8_t index
);

/**
 * @brief Decode a gradido transaction from protobuf binary wire format.
 *
 * Parses the binary representation and populates the transaction structure.
 * Requires an area allocator for nested allocations. The binary stream settles into
 * transaction form.
 *
 * @param[out] tx       Gradido transaction to populate.
 * @param[in]  binary_src Source memory block containing binary data.
 * @param[in]  allocator Area allocator for nested allocations.
 * @return              GRD_SUCCESS on success,
 *                      GRD_ERROR_OUT_OF_MEMORY if allocator hasn't enough space.
 * @note                The allocator must be an area allocator; memory is
 *                      not freed individually but as a whole.
 */
grd_result grdw_gradido_transaction_decode(
    grdw_gradido_transaction *tx, const grd_memory_block *binary_src, grd_memory *allocator
);

/**
 * @brief Encode a gradido transaction into protobuf binary wire format.
 *
 * Serializes the transaction structure into a compact binary representation.
 * The encoded form travels across the network, carrying signed intent between nodes.
 *
 * @param[out] binary_dst   Destination memory block for encoded data.
 * @param[out] final_size  Number of bytes written to binary_dst.
 * @param[in]  tx          Gradido transaction to encode.
 * @param[in]  allocator   Memory allocator for temporary encoding buffers.
 * @return                GRD_SUCCESS on success
 *                        GRD_ERROR_DESTINATION_BUFFER_TO_SMALL if binary_dst is to small
 *                        GRD_ERROR_OUT_OF_MEMORY if allocator hasn't enough capacity
 *                        GRD_ERROR_ENCODE_FAILED should only happen on message schema update
 * @whisper                Authorization becomes message
 */
grd_result grdw_gradido_transaction_encode(
    grd_memory_block *binary_dst,
    size_t *final_size,
    const grdw_gradido_transaction *tx,
    grd_memory *allocator
);

/**
 * @brief Free all memory owned by a gradido transaction.
 *
 * Releases the signature map array and the body bytes memory block. The transaction
 * dissolves back to a clean state, ready for reuse or destruction.
 *
 * @param[in/out] tx        Gradido transaction to free.
 * @param[in]     allocator Memory allocator used for allocating memory.
 */
void grdw_gradido_transaction_free(grdw_gradido_transaction *tx, grd_memory *allocator);

/** @} */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_GRADIDO_TRANSACTION_H
