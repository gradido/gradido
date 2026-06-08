#ifndef GRADIDO_BLOCKCHAIN_CORE_INTERACTIONS_VALIDATE_CONTEXT_H
#define GRADIDO_BLOCKCHAIN_CORE_INTERACTIONS_VALIDATE_CONTEXT_H

#ifdef __cplusplus
extern "C" {
#endif

#include "result_type.h"

typedef struct grdi_validate_options grdi_validate_options;
typedef struct grdr_complete_transaction grdr_complete_transaction;
typedef struct grd_error_details grd_error_details;

//! \param error_details only used if not set to null
grdi_validate_result_type grdi_validate_complete_transaction(
    const grdr_complete_transaction *input_tx,
    const grdi_validate_options *options,
    grd_error_details *error_details
);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_INTERACTIONS_VALIDATE_CONTEXT_H
