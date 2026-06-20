#ifndef GRADIDO_BLOCKCHAIN_CORE_MAPPING_PBTOOLS_WIRE_H
#define GRADIDO_BLOCKCHAIN_CORE_MAPPING_PBTOOLS_WIRE_H

// make sure, that generated protobuf enum is identical with grdw enum
#include "gradido_blockchain_core/result.h"

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grdm_wire_from_pbtools grdm_wire_from_pbtools
 *  @ingroup mapping
 *  @brief Conversion from protobuf to wire format
 *  @{
 */

// forward declarations from pbtools
struct proto_gradido_transaction_body_t;
struct proto_gradido_gradido_transaction_t;
struct proto_gradido_confirmed_transaction_t;

// forward declarations from gradido data wire
typedef struct grdw_confirmed_transaction grdw_confirmed_transaction;
typedef struct grdw_gradido_transaction grdw_gradido_transaction;
typedef struct grdw_transaction_body grdw_transaction_body;

typedef struct grd_memory grd_memory;

/**
 * @brief Convert transaction body from protobuf to wire format.
 *
 * Transforms a protobuf transaction body into its wire-format representation.
 * The conversion preserves all memos, cross-group metadata, and the transaction
 * payload union. Data flows from structured protobuf to binary wire.
 *
 * @param[out] transaction_body Wire-format transaction body to populate.
 * @param[in]  pb_transaction_body Protobuf transaction body source.
 * @param[in]  allocator          Memory allocator for the conversion.
 * @return                        GRD_SUCCESS on success, error code on failure.
 */
grd_result grdm_transaction_body_from_pbtools(
    grdw_transaction_body *transaction_body,
    const struct proto_gradido_transaction_body_t *pb_transaction_body,
    grd_memory *allocator
);

/**
 * @brief Convert gradido transaction from protobuf to wire format.
 *
 * Transforms a protobuf gradido transaction into its wire-format representation,
 * including the signature map, body bytes, and pairing ledger anchor. The
 * conversion carries authorization from protobuf to wire.
 *
 * @param[out] tx        Wire-format gradido transaction to populate.
 * @param[in]  pbtx      Protobuf gradido transaction source.
 * @param[in]  allocator Memory allocator for the conversion.
 * @return              GRD_SUCCESS on success, error code on failure.
 */
grd_result grdm_gradido_transaction_from_pb(
    grdw_gradido_transaction *tx,
    const struct proto_gradido_gradido_transaction_t *pbtx,
    grd_memory *allocator
);

/**
 * @brief Convert confirmed transaction from protobuf to wire format.
 *
 * Transforms a protobuf confirmed transaction into its wire-format representation,
 * including the transaction ID, ledger anchor, running hash, and account balances.
 * The settled state flows from protobuf to wire.
 *
 * @param[out] confirmed_tx Wire-format confirmed transaction to populate.
 * @param[in]  pb_confirmed_tx Protobuf confirmed transaction source.
 * @param[in]  allocator       Memory allocator for the conversion.
 * @return                    GRD_SUCCESS on success, error code on failure.
 */
grd_result grdm_confirmed_transaction_from_pb(
    grdw_confirmed_transaction *confirmed_tx,
    const struct proto_gradido_confirmed_transaction_t *pb_confirmed_tx,
    grd_memory *allocator
);

/** @} */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_MAPPING_PBTOOLS_WIRE_H
