#include "gradido_blockchain_core/data/runtime/complete_transaction.h"
#include "gradido_blockchain_core/error_details.h"
#include "gradido_blockchain_core/interactions/validate/context.h"
#include "gradido_blockchain_core/interactions/validate/options.h"
#include "gradido_blockchain_core/interactions/validate/result_type.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"

grdi_validate_result_type grdi_validate_complete_transaction_transfer(
    const grdr_complete_transaction *input_tx,
    const grdi_validate_options *options,
    grd_error_details *error_details
) {
  return GRDI_VALIDATE_NOT_IMPLEMENTED_YET;
}
