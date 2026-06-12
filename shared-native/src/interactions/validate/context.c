#include "gradido_blockchain_core/interactions/validate/context.h"
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/data/runtime/complete_transaction.h"
#include "gradido_blockchain_core/data/wire/basic_types.h"
#include "gradido_blockchain_core/error_details.h"
#include "gradido_blockchain_core/interactions/validate/options.h"
#include "gradido_blockchain_core/interactions/validate/result_type.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/address.h"
#include "gradido_blockchain_core/types/balance_derivation.h"
#include "gradido_blockchain_core/types/cross_group.h"
#include "gradido_blockchain_core/types/ledger_anchor.h"
#include "gradido_blockchain_core/types/memo_key.h"
#include "gradido_blockchain_core/types/transaction.h"

#ifdef USE_SODIUM
#include "sodium.h"
#endif // USE_SODIUM

#include <stddef.h>
#include <stdlib.h>
#include <string.h>

static const uint8_t zeros_x64[64] = {0};
#define IS_EMPTY_UUID(arr) (memcmp(arr, zeros_x64, 16) == 0)
#define IS_EMPTY_PUBLIC_KEY(arr) (memcmp(arr, zeros_x64, 32) == 0)
#define IS_EMPTY_GENERIC_HASH(arr) (memcmp(arr, zeros_x64, 32) == 0)
#define IS_EMPTY_SIGNATURE(arr) (memcmp(arr, zeros_x64, 64) == 0)

// all checks which don't need other transactions
static grdi_validate_result_type validateCommon(
    const grdr_complete_transaction *input_tx,
    const grdi_validate_options *options,
    grd_error_details *error_details
) {
  if (!input_tx->tx_nr) {
    grd_error_details_fill(error_details, "txNr is invalid", "0", "> 0");
    return GRDI_VALIDATE_INVALID_FIELD;
  }
  if (!input_tx->body_bytes.size || !input_tx->body_bytes.data) {
    grd_error_details_fill(error_details, "empty body bytes", NULL, NULL);
    return GRDI_VALIDATE_INVALID_FIELD;
  }
  // 946681200 = 01.01.2000
  if (input_tx->confirmed_at.seconds < 946681200) {
    grd_error_details_fill_actual_is_number(
        error_details, "confirmedAt.seconds is to small", input_tx->confirmed_at.seconds,
        "> 946681200 (01.01.2000)"
    );
    return GRDI_VALIDATE_INVALID_FIELD;
  }

  // check if community id index is valid, therefore an entry exist in Community Id Dictionary
  if (IS_EMPTY_UUID(input_tx->tx_community_uuid)) {
    grd_error_details_fill(error_details, "empty community uuid", NULL, NULL);
    return GRDI_VALIDATE_INVALID_FIELD;
  }
  grdd_timestamp diff = grdd_timestamp_minus(&input_tx->created_at, &input_tx->confirmed_at);
  if (abs(diff.seconds) >
      MAGIC_NUMBER_MAX_TIMESPAN_BETWEEN_CREATING_AND_RECEIVING_TRANSACTION_SECONDS) {
    grd_error_details_fill_actual_is_number(
        error_details, "timespan between created at and confirmed at are more than expected",
        abs(diff.seconds), "120 seconds"
    );

    return GRDI_VALIDATE_INVALID_FIELD;
  }
  if (GRDT_LEDGER_ANCHOR_UNSPECIFIED == input_tx->ledger_anchor.type) {
    grd_error_details_fill(error_details, "empty ledger anchor", NULL, NULL);
    return GRDI_VALIDATE_INVALID_FIELD;
  }

  // from here an for confirmed and not confirmed transactions

  // check if it is a cross community transaction, that needed informations are there
  if (input_tx->cross_group_type != GRDT_CROSS_GROUP_LOCAL) {
    if (GRDT_TRANSACTION_COMMUNITY_FRIENDS_UPDATE != input_tx->transaction_type &&
        GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER != input_tx->transaction_type &&
        GRDT_TRANSACTION_TRANSFER != input_tx->transaction_type) {
      grd_error_details_fill(
          error_details,
          "cross group transactions (currently) only possible with Transfer, Redeem Deferred "
          "Transfer and Community Friends Update",
          NULL, NULL
      );
      return GRDI_VALIDATE_INVALID_TRANSACTION_TYPE;
    }

    if (!input_tx->tx_pairing_community_uuid) {
      grd_error_details_fill(
          error_details, "missing pairing community id index for cross group transaction", NULL,
          NULL
      );
      return GRDI_VALIDATE_INVALID_FIELD;
    }
    if (GRDT_CROSS_GROUP_INBOUND == input_tx->cross_group_type &&
        !input_tx->pairing_ledger_anchor) {
      grd_error_details_fill(
          error_details, "empty pairing ledger anchor for Inbound Cross Group Transaction", NULL,
          NULL
      );
      return GRDI_VALIDATE_INVALID_FIELD;
    }
  }
  if (GRDT_BALANCE_DERIVATION_UNSPECIFIED == input_tx->balance_derivation_type) {
    grd_error_details_fill(error_details, "balanceDerivationType is unspecified", NULL, NULL);
    return GRDI_VALIDATE_INVALID_FIELD;
  }
  if (input_tx->signature_pairs_count) {
    for (int i = 0; i < input_tx->signature_pairs_count; i++) {
      grdw_signature_pair *sigPair = &input_tx->signature_pairs[i];
      if (IS_EMPTY_PUBLIC_KEY(sigPair->public_key)) {
        grd_error_details_fill(error_details, "empty public key in signature map", NULL, NULL);
        return GRDI_VALIDATE_INVALID_FIELD;
      }
      if (IS_EMPTY_SIGNATURE(sigPair->signature)) {
        grd_error_details_fill(error_details, "empty signature in signature map", NULL, NULL);
        return GRDI_VALIDATE_INVALID_FIELD;
      }
#ifdef USE_SODIUM
      if (options->enable_verify) {
        // TODO: move into PublicKey or ed25519KeyPair
        if (crypto_sign_verify_detached(
                sigPair->signature, input_tx->body_bytes.data, input_tx->body_bytes.size,
                sigPair->public_key
            ) != 0) {
          grd_error_details_fill(
              error_details, "on of the signatures cannot be verified", NULL, NULL
          );
          return GRDI_VALIDATE_CRYPTO_SIGN_INVALID;
        }
      }
#endif // USE_SODIUM
    }
  }
  return GRDI_VALIDATE_SUCCESS;
}

grdi_validate_result_type grdi_validate_complete_transaction(
    const grdr_complete_transaction *input_tx,
    const grdi_validate_options *options,
    grd_error_details *error_details
) {
  if (!input_tx || !options) { return GRDI_VALIDATE_NULL_POINTER; }

  if (error_details && !grd_error_details_is_initalized_and_empty(error_details)) {
    return GRDI_VALIDATE_INVALID_ERROR_DETAILS_STATE;
  }
  grdi_validate_result_type result = validateCommon(input_tx, options, error_details);
  if (result != GRDI_VALIDATE_SUCCESS) { return result; }

  /*
  switch (input_tx->transaction_type) {
  case GRDT_TRANSACTION_TRANSFER:
  case GRDT_TRANSACTION_DEFERRED_TRANSFER:
  case GRDT_TRANSACTION_REDEEM_DEFERRED_TRANSFER:
  case GRDT_TRANSACTION_TIMEOUT_DEFERRED_TRANSFER:
    result = validateGradidoTransfer(tx, appContext, options);
    break;
  case GRDT_TRANSACTION_CREATION:
    result = validateGradidoCreation(tx, appContext, options);
    break;
  case GRDT_TRANSACTION_REGISTER_ADDRESS:
    result = validateRegisterAddress(tx, appContext, options);
    break;
  case GRDT_TRANSACTION_COMMUNITY_ROOT:
    result = validateCommunityRoot(tx, blockchain, options);
    break;
  default:
    grd_error_details_fill_actual_is_number(
      error_details,
      "validation for transaction type missing",
      (int64_t)input_tx->transaction_type,
      NULL
    );
    return GRDI_VALIDATE_ENUM_UNHANDLED;
  }
  */
  return result;
}

grdi_validate_result_type grdi_validate_complete_transaction_flat_options(
    const grdr_complete_transaction *input_tx, bool enable_verify, grd_error_details *error_details
) {
  grdi_validate_options options = {.enable_verify = enable_verify};
  return grdi_validate_complete_transaction(input_tx, &options, error_details);
}
