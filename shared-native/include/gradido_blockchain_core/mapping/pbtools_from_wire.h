#ifndef GRADIDO_BLOCKCHAIN_CORE_MAPPING_PBTOOLS_FROM_WIRE_H
#define GRADIDO_BLOCKCHAIN_CORE_MAPPING_PBTOOLS_FROM_WIRE_H

// make sure, that generated protobuf enum is identical with grdw enum
#include "gradido_blockchain_core/result.h"

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup mapping Mapping and Conversion
 *  @brief Conversion between wire format and protobuf structures
 */

/** @defgroup grdm_pbtools_from_wire grdm_pbtools_from_wire
 *  @ingroup mapping
 *  @brief Conversion from wire format to protobuf
 *  @{
 */

// forward declarations from pbtools
struct proto_gradido_confirmed_transaction_t;
struct proto_gradido_gradido_transaction_t;
struct proto_gradido_transaction_body_t;

// forward declarations from gradido data wire
typedef struct grdw_confirmed_transaction grdw_confirmed_transaction;
typedef struct grdw_gradido_transaction grdw_gradido_transaction;
typedef struct grdw_transaction_body grdw_transaction_body;

/**
 * @brief Convert transaction body from wire format to protobuf.
 *
 * Transforms a wire-format transaction body into its protobuf representation.
 * The conversion preserves all memos, cross-group metadata, and the transaction
 * payload union. Data flows from binary wire to structured protobuf.
 *
 * @param[out] pb_transaction_body Protobuf transaction body to populate.
 * @param[in]  transaction_body     Wire-format transaction body source.
 * @return                         GRD_SUCCESS on success, error code on failure.
 */
grd_result grdm_transaction_body_from_wire(
    struct proto_gradido_transaction_body_t *pb_transaction_body,
    const grdw_transaction_body *transaction_body
);

/**
 * @brief Convert gradido transaction from wire format to protobuf.
 *
 * Transforms a wire-format gradido transaction into its protobuf representation,
 * including the signature map, body bytes, and pairing ledger anchor. The
 * conversion carries authorization from wire to protobuf.
 *
 * @param[out] pbtx Protobuf gradido transaction to populate.
 * @param[in]  tx   Wire-format gradido transaction source.
 * @return          GRD_SUCCESS on success, error code on failure.
 */
grd_result grdm_gradido_transaction_from_wire(
    struct proto_gradido_gradido_transaction_t *pbtx, const grdw_gradido_transaction *tx
);

/**
 * @brief Convert confirmed transaction from wire format to protobuf.
 *
 * Transforms a wire-format confirmed transaction into its protobuf representation,
 * including the transaction ID, ledger anchor, running hash, and account balances.
 * The settled state flows from wire to protobuf.
 *
 * @param[out] pb_confirmed_tx Protobuf confirmed transaction to populate.
 * @param[in]  confirmed_tx    Wire-format confirmed transaction source.
 * @return                     GRD_SUCCESS on success, error code on failure.
 */
grd_result grdm_confirmed_transaction_from_wire(
    struct proto_gradido_confirmed_transaction_t *pb_confirmed_tx,
    const grdw_confirmed_transaction *confirmed_tx
);

/** @} */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_MAPPING_PBTOOLS_FROM_WIRE_H
