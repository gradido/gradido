#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_BASIC_TYPES_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_BASIC_TYPES_H

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/types/memo_key.h"

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grdw_basic_types grdw_basic_types
 *  @ingroup wire
 *  @brief Fundamental wire format structures
 *  @{
 */

/**
 * @brief Account balance with public key and coin color (community_uuid).
 *
 * Represents the state of an account, holding the public key,
 * the balance value, and the community UUID. The balance flows through the ledger
 * as transactions settle and transform.
 *
 * @var grdw_account_balance::pubkey
 * 32-byte Ed25519 public key identifying the account.
 *
 * @var grdw_account_balance::balance
 * Signed 64-bit balance value (fixed-point scaling 10^4).
 *
 * @var grdw_account_balance::community_uuid
 * 16-byte UUID of the community where the gdd where created.
 */
typedef struct grdw_account_balance {
  uint8_t pubkey[SIGN_PUBLIC_KEY_SIZE];
  int64_t balance;
  uint8_t community_uuid[UUID_BINARY_SIZE];
} grdw_account_balance;

/**
 * @brief Encrypted memo with type identifier and payload.
 *
 * Contains a memo key type indicating the encryption method and the encrypted
 * payload as a memory block. Private messages travel securely through the network,
 * readable only by intended recipients.
 *
 * @var grdw_encrypted_memo::type
 * Memo key type specifying the encryption scheme.
 *
 * @var grdw_encrypted_memo::memo
 * Memory block containing the encrypted memo payload.
 */
typedef struct grdw_encrypted_memo {
  grdt_memo_key type;
  grd_memory_block memo;
} grdw_encrypted_memo;

/**
 * @brief Public key and signature pair for cryptographic verification.
 *
 * Holds an Ed25519 public key and its corresponding 64-byte signature. The pair
 * binds an identity to an action, allowing the network to verify authorization
 * as transactions flow through consensus.
 *
 * @var grdw_signature_pair::public_key
 * 32-byte Ed25519 public key of the signer.
 *
 * @var grdw_signature_pair::signature
 * 64-byte Ed25519 signature over the signed data.
 */
typedef struct grdw_signature_pair {
  uint8_t public_key[SIGN_PUBLIC_KEY_SIZE];
  uint8_t signature[SIGN_SIGNATURE_SIZE];
} grdw_signature_pair;

/**
 * @brief Timestamp represented as seconds since epoch.
 *
 * A simple 64-bit second count for time-based operations. Time flows forward
 * as the blockchain progresses, anchoring events in a linear sequence.
 *
 * @var grdw_timestamp_seconds::seconds
 * Seconds since Unix epoch (1970-01-01 00:00:00 UTC).
 */
typedef struct grdw_timestamp_seconds {
  int64_t seconds;
} grdw_timestamp_seconds;

/**
 * @brief Transfer amount with recipient and coin color (community_uuid).
 *
 * Specifies the amount to transfer, the recipient's public key, and the target
 * community UUID. Value moves from sender to recipient as the transfer settles,
 * respecting community boundaries.
 *
 * @var grdw_transfer_amount::pubkey
 * 32-byte Ed25519 public key of the recipient.
 *
 * @var grdw_transfer_amount::amount
 * Signed 64-bit amount to transfer (fixed-point scaling 10^4).
 *
 * @var grdw_transfer_amount::community_uuid
 * 16-byte UUID of the community where the gdd where created.
 */
typedef struct grdw_transfer_amount {
  uint8_t pubkey[SIGN_PUBLIC_KEY_SIZE];
  int64_t amount;
  uint8_t community_uuid[UUID_BINARY_SIZE];
} grdw_transfer_amount;

/** @} */

#ifdef __cplusplus
}
#endif

#endif /* GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_BASIC_TYPES_H */
