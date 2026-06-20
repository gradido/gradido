#ifndef GRADIDO_BLOCKCHAIN_C_DATA_WIRE_TRANSACTION_BODY_H
#define GRADIDO_BLOCKCHAIN_C_DATA_WIRE_TRANSACTION_BODY_H

#include "basic_types.h"

#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/cross_group.h"
#include "gradido_blockchain_core/types/transaction.h"
#include "specific_transactions.h"

/** @defgroup wire Wire Format Serialization
 *  @ingroup data
 *  @brief Binary encoding and decoding for blockchain data structures
 */

/** @defgroup grdw_transaction_body grdw_transaction_body
 *  @ingroup wire
 *  @brief Transaction body with memos and cross-group support
 *  @{
 */

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Transaction body carrying memos, cross-group metadata, and transaction payload.
 *
 * The body holds encrypted memos for privacy, an optional target community UUID for
 * cross-group transactions, a creation timestamp, and a union of all possible
 * transaction types. It flows through the network as the core container of economic intent.
 *
 */
typedef struct grdw_transaction_body {
  //! Array of encrypted memo pointers, allocated via reserve_memos.
  grdw_encrypted_memo *memos;
  //! Optional 16-byte UUID of the target community for cross-group transactions.
  uint8_t *other_community_uuid;
  //! Timestamp marking when the transaction was created.
  grdd_timestamp created_at;
  union {
    //! Simple transfer of Gradido between two accounts, if transaction_type =
    //! GRDT_TRANSACTION_TRANSFER
    grdw_gradido_transfer transfer;
    //! Creation of new Gradido through active basic income, if transaction_type =
    //! GRDT_TRANSACTION_CREATION
    grdw_gradido_creation creation;
    grdw_community_friends_update community_friends_update;
    //! Register a human-readable address linked to a public key, if transaction_type =
    //! GRDT_TRANSACTION_REGISTER_ADDRESS
    grdw_register_address register_address;
    //! Transfer GDD to seeded address, used for transaction links, if transaction_type =
    //! GRDT_TRANSACTION_DEFERRED_TRANSFER
    grdw_gradido_deferred_transfer deferred_transfer;
    //! Define a new community root identity, only first tx per community, if transaction_type =
    //! GRDT_TRANSACTION_COMMUNITY_ROOT
    grdw_community_root community_root;
    //! Redeem a deferred transfer, change back to sender, if transaction_type =
    //! GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER
    grdw_gradido_redeem_deferred_transfer redeem_deferred_transfer;
    //! Timeout of a deferred transfer, returning funds to sender, if transaction_type =
    //! GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER
    grdw_gradido_timeout_deferred_transfer timeout_deferred_transfer;
  };
  //! Discriminant indicating which union member is active and which transaction type this is
  grdt_transaction transaction_type;
  //! Cross-group type (local, incoming, outgoing or cross).
  grdt_cross_group type;
  //! Number of memos
  uint8_t memos_count;
} grdw_transaction_body;

/**
 * @brief Initialize a transaction body to a clean, empty state.
 *
 * Sets all pointers to null and numeric fields to zero. The body emerges
 * ready to receive its first allocation and payload.
 *
 * @param[out] body  Transaction body to initialize.
 */
void grdw_transaction_body_init(grdw_transaction_body *body);

/**
 * @brief Reserve memory for a given number of memo slots.
 *
 * Allocates an array of memo pointers using the provided allocator. This must
 * be called before any move_memo or copy_memo operations. The array breathes
 * into existence, holding space for encrypted messages.
 *
 * @param[in/out] body          Transaction body to reserve memos in.
 * @param[in]     memos_count   Number of memo slots to allocate. Max 255.
 * @param[in]     allocator     Memory allocator for the pointer array.
 * @return                      GRD_SUCCESS on success
 *                              GRD_ERROR_OUT_OF_MEMORY if allocater hasn't enough space.
 */
grd_result grdw_transaction_body_reserve_memos(
    grdw_transaction_body *body, size_t memos_count, grd_memory *allocator
);

/**
 * @brief Move a memo into a reserved slot, taking ownership of the pointer.
 *
 * Transfers the memo pointer to the body at the specified index. If a memo
 * already exists at that index, it is overwritten without freeing. The caller
 * must have called reserve_memos first. Ownership flows from caller to body.
 *
 * @param[in/out] body  Transaction body to receive the memo.
 * @param[in]     memo  Memo pointer to move (ownership transferred).
 * @param[in]     index Target slot index.
 * @return              GRD_SUCCESS on success,
 *                      GRD_ERROR_ARRAY_INDEX_OUT_OF_BOUNDS if index >= memos_count.
 */
grd_result grdw_transaction_body_move_memo(
    grdw_transaction_body *body, grdw_encrypted_memo *memo, uint8_t index
);

/**
 * @brief Copy a memo into a reserved slot, allocating memory for the copy.
 *
 * Deep-copies the memo structure and its underlying memory block into the body
 * at the specified index. The caller must have called reserve_memos first.
 * The allocator is used for both the memo structure and its payload.
 *
 * @param[in/out] body      Transaction body to receive the memo copy.
 * @param[in]     memo      Source memo to copy from.
 * @param[in]     index     Target slot index.
 * @param[in]     allocator Memory allocator for the copy.
 * @return                  GRD_SUCCESS on success
 *                          GRD_ERROR_OUT_OF_MEMORY if allocater hasn't enough space.
 */
grd_result grdw_transaction_body_copy_memo(
    grdw_transaction_body *body,
    const grdw_encrypted_memo *memo,
    uint8_t index,
    grd_memory *allocator
);

/**
 * @brief Decode a transaction body from binary wire format.
 *
 * Parses the binary representation and populates the body structure, including
 * the transaction payload union and all memos. Requires an area allocator for
 * nested allocations. The binary stream settles into structured form.
 *
 * @param[out] body       Transaction body to populate.
 * @param[in]  binary_src  Source memory block containing binary data.
 * @param[in]  allocator  Area allocator for nested allocations.
 * @return                GRD_SUCCESS on success,
 *                        GRD_ERROR_OUT_OF_MEMORY if allocater hasn't enough space.
 * @note                  The allocator must be an area allocator; memory is
 *                        not freed individually but as a whole.
 * @whisper                From chaos comes form
 */
grd_result grdw_transaction_body_decode(
    grdw_transaction_body *body, const grd_memory_block *binary_src, grd_memory *allocator
);

/**
 * @brief Encode a transaction body into binary wire format.
 *
 * Serializes the body structure, including the active transaction payload and
 * all memos, into a compact binary representation. The encoded form travels
 * across the network, carrying economic intent between nodes.
 *
 * @param[out] binary_dst   Destination memory block for encoded data.
 * @param[out] final_size  Number of bytes written to binary_dst.
 * @param[in]  body        Transaction body to encode.
 * @param[in]  allocator  Memory allocator for temporary encoding buffers.
 * @return                GRD_SUCCESS on success
 *                        GRD_ERROR_DESTINATION_BUFFER_TO_SMALL if binary_dst is to small
 *                        GRD_ERROR_OUT_OF_MEMORY if allocator hasn't enough capacity
 *                        GRD_ERROR_ENCODE_FAILED should only happen on message schema update
 * @whisper                Form becomes message
 */
grd_result grdw_transaction_body_encode(
    grd_memory_block *binary_dst,
    size_t *final_size,
    const grdw_transaction_body *body,
    grd_memory *allocator
);

/**
 * @brief Free all memory owned by a transaction body.
 *
 * Releases the memo array, other community UUID, and any nested allocations
 * within the transaction payload union. The body dissolves back to a clean
 * state, ready for reuse or destruction.
 *
 * @param[in/out] body      Transaction body to free.
 * @param[in]     allocator Memory allocator used for allocating memory.
 */
void grdw_transaction_body_free(grdw_transaction_body *body, grd_memory *allocator);

/** @} */

#ifdef __cplusplus
}
#endif

#endif /* GRADIDO_BLOCKCHAIN_C_DATA_WIRE_TRANSACTION_BODY_H */
