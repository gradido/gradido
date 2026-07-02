#ifndef GRADIDO_BLOCKCHAIN_CORE_MAPPING_RUNTIME_FROM_WIRE_H
#define GRADIDO_BLOCKCHAIN_CORE_MAPPING_RUNTIME_FROM_WIRE_H

// make sure, that generated protobuf enum is identical with grdw enum
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/result.h"

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grdm_runtime_from_wire grdm_runtime_from_wire
 *  @ingroup mapping
 *  @brief Conversion from wire format to runtime structures
 *  @{
 */

// forward declarations from gradido data wire
typedef struct grdr_complete_transaction grdr_complete_transaction;
typedef struct grdw_confirmed_transaction grdw_confirmed_transaction;
typedef struct grdw_transaction_body grdw_transaction_body;

/**
 * @brief Convert wire format structures to a complete runtime transaction.
 *
 * Combines a transaction body and confirmed transaction into a single runtime
 * transaction structure. The community UUID provides context for the conversion.
 * Data flows from separated wire components into a unified runtime representation.
 *
 * @param[out] tx              Runtime complete transaction to populate.
 * @param[in]  body            Wire-format transaction body source.
 * @param[in]  confirmed_tx    Wire-format confirmed transaction source.
 * @param[in]  community_uuid  16-byte UUID of the community context.
 * @return                     GRD_SUCCESS on success, error code on failure.
 */
grd_result grdm_complete_transaction_from_wire(
    grdr_complete_transaction *tx,
    const grdw_transaction_body *body,
    const grdw_confirmed_transaction *confirmed_tx,
    const uint8_t community_uuid[UUID_BINARY_SIZE]
);

/** @} */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_MAPPING_RUNTIME_FROM_WIRE_H
