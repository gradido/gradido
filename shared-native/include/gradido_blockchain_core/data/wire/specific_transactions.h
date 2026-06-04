#ifndef GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_SPECIFIC_TRANSACTIONS_H
#define GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_SPECIFIC_TRANSACTIONS_H

#include <stdbool.h>

#include "basic_types.h"
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/memory.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/address.h"
#include "hiero.h"
#include "ledger_anchor.h"

#ifdef __cplusplus
extern "C" {
#endif

/** @defgroup grdw_specific_transactions grdw_specific_transactions
 *  @ingroup wire
 *  @brief Specific transaction payload structures
 *  @{
 */

/**
 * @brief Community friends update with color fusion flag.
 *
 * Contains a boolean indicating whether color fusion is enabled for the community.
 * The update flows through the network, changing how communities interact.
 */
typedef struct grdw_community_friends_update {
  //! Flag indicating whether color fusion is enabled.
  bool color_fusion;
} grdw_community_friends_update;

/**
 * @brief Community root definition with three public keys.
 *
 * Anchors the cryptographic identity of a Gradido community. The root private
 * key, which is not stored in this structure, is the source from which all
 * in-community keys are derived via SLIP-0010. Its corresponding public key is
 * stored here and serves as the root identity. All register-address
 * transactions must be signed with the root private key and can be verified
 * with this public key.
 *
 * The two additional public keys are the receiving accounts for the
 * community's pillar-based creations:
 *
 * - **gmw_pubkey**: Receives the Common Good (Gemeinwohl) creation funds.
 * - **auf_pubkey**: Receives the Compensation & Environment Fund (AUF) creation funds.
 *
 * This structure is the cryptographic foundation for a community's
 * decentralized and purpose-bound allocation of new funds.
 *
 * @var grdw_community_root::pubkey
 * Root public key. The corresponding private key derives all community keys
 * and signs register-address transactions.
 *
 * @var grdw_community_root::gmw_pubkey
 * Public key of the account that receives Common Good (Gemeinwohl) creations.
 *
 * @var grdw_community_root::auf_pubkey
 * Public key of the account that receives AUF (Compensation & Environment Fund) creations.
 *
 * @note The root private key is never stored in this structure and must be
 *       kept in a secure location, such as a hardware security module.
 * @whisper One root, many branches – the trunk remains unseen
 */
typedef struct grdw_community_root {
  //! Root public key: verifies register-address txs and identifies the community.
  uint8_t pubkey[ED25519_PUBLIC_KEY_SIZE];
  //! Public key for Common Good (Gemeinwohl) creation funds.
  uint8_t gmw_pubkey[ED25519_PUBLIC_KEY_SIZE];
  //! Public key for Compensation & Environment Fund (AUF) creation funds.
  uint8_t auf_pubkey[ED25519_PUBLIC_KEY_SIZE];
} grdw_community_root;

/**
 * @brief Creation of new Gradido through active basic income.
 *
 * Represents the emergence of new value into the system, guided by the first
 * natural law of symbiosis and cooperation. Each person may create up to 1,000
 * Gradidos per month. Creations are typically applied retroactively, covering
 * past months during which the recipient contributed to the common good.
 *
 * The `target_date` anchors this creation to a specific calendar month. It is
 * not a forward-looking deadline but a backward-looking reference: it declares
 * the month for which this creation is valid. The sum of all creations assigned
 * to the same month for the same person must not exceed 1,000 Gradidos.
 *
 * @var grdw_gradido_creation::recipient
 * Recipient's transfer amount, including pubkey, amount, and the community
 * UUID where the new Gradidos originate.
 *
 * @var grdw_gradido_creation::target_date
 * Timestamp anchoring this creation to a specific month. The creation counts
 * toward that month's per-person limit of 1,000 Gradidos.
 *
 * @whisper A seed planted in the past, blooming now
 */
typedef struct grdw_gradido_creation {
  //! Recipient's transfer amount with pubkey, amount, and community UUID.
  grdw_transfer_amount recipient;
  //! Month anchor for the creation (1,000 GDD/month limit is applied here).
  grdw_timestamp_seconds target_date;
} grdw_gradido_creation;

/**
 * @brief Gradido transfer between sender and recipient.
 *
 * Represents a simple transfer of Gradido from a sender to a recipient. The
 * sender's public key, amount of transaction and coin origin community are specified, while the
 * recipient is identified by public key. Value flows from one account to another.
 */
typedef struct grdw_gradido_transfer {
  //! Sender's pulic key, transfer amount, and coin origin community UUID.
  grdw_transfer_amount sender;
  //! Recipient's 32-byte Ed25519 public key.
  uint8_t recipient[ED25519_PUBLIC_KEY_SIZE];
} grdw_gradido_transfer;

/**
 * @brief Deferred transfer creating a redeemable one-way account.
 *
 * Immediately moves funds from the sender to a freshly generated one-way
 * account identified by a public key derived from a secret code. The sender
 * provides the full amount: the intended transfer sum plus enough extra to
 * cover the decay that will occure between creation and timeout. This extra
 * decay reserve ensures the recipient can always redeem the full intended
 * amount at any point within the timeout window.
 *
 * The code used to derive the key pair is shared with the recipient, who can
 * then call redeem_deferred_transfer to claim the funds. If the recipient
 * redeems early, the unspent decay reserve flows back to the sender. If the
 * timeout expires without redemption, the sender reclaims the entire account
 * balance.
 *
 * @whisper A locked door waiting for the right key
 */
typedef struct grdw_gradido_deferred_transfer {
  //! The transfer that funds the one-way account. Its amount equals the intended
  //! transfer sum plus the decay reserve for the full timeout duration.
  grdw_gradido_transfer transfer;

  //! Timeout in seconds. The decay reserve is calculated so that after this
  //! duration the remaining funds exactly cover the intended transfer amount
  uint32_t timeout_duration;
} grdw_gradido_deferred_transfer;

/**
 * @brief Redemption of a deferred transfer.
 *
 * Redeems the deferred transfer by spending from the one-way account created
 * at fund time. The recipient uses the secret code as seed to calculate the ed25519 private key to
 * authorize the redemption. The transfer specifies the intended recipient and
 * the amount to claim, which must not exceed the non-decayed portion of the
 * one-way account's current balance.
 *
 * Any unused decay reserve remaining in the one-way account after the
 * redemption is automatically returned to the original sender as change. The
 * deferred transfer completes its journey as value moves to the intended
 * recipient and the excess decay reserve flows back to its source.
 *
 * @whisper The lock opens and the surplus returns home
 */
typedef struct grdw_gradido_redeem_deferred_transfer {
  //! Transaction number of the original deferred transfer that created the
  //! one-way account.
  uint64_t deferred_transfer_transaction_nr;
  //! The transfer to execute from the one-way account to the redeeming
  //! recipient.
  grdw_gradido_transfer transfer;
} grdw_gradido_redeem_deferred_transfer;

/**
 * @brief Timeout of a deferred transfer.
 *
 * Called when a deferred transfer reaches its timeout without being redeemed.
 * Returns the entire remaining balance of the one-way account – the
 * original transfer amount because the decay surplus is now decayed – back
 * to the sender. The one-way account dissolves, having served its purpose.
 *
 * @whisper The door closes and everything returns to where it began
 */
typedef struct grdw_gradido_timeout_deferred_transfer {
  //! Transaction number of the original deferred transfer whose timeout has
  //! expired.
  uint64_t deferred_transfer_transaction_nr;
} grdw_gradido_timeout_deferred_transfer;

/**
 * @brief Anchors a human identity to a cryptographic account within a community.
 *
 * Registers a human-readable name (via its hash) and links it to a public key,
 * creating the on-chain identity for a community member. The address type
 * defines the role and capabilities of this identity. For a newly joining
 * human, the type is GRDT_ADDRESS_COMMUNITY_HUMAN.
 *
 * Account keys are derived from the user's personal key following the
 * SLIP-0010 standard (Ed25519 key derivation). The derivation_index marks the
 * generation of the account key. It starts at 1 for a member’s first account.
 * Only this first account (index 1) with type GRDT_ADDRESS_COMMUNITY_HUMAN is
 * authorized to receive creations – no other index and no other type may
 * create new Gradidos.
 *
 * For now, every new member opens exactly one account. In the future, this
 * structure will also be used to register sub-accounts of an existing member
 * or to move a member's identity to a different community.
 *
 * @whisper A single root with the sole power to bloom
 */
typedef struct grdw_register_address {
  //! User's 32-byte Ed25519 public key.
  uint8_t user_pubkey[ED25519_PUBLIC_KEY_SIZE];
  //! The role of this address in the community. For new human members,
  //! GRDT_ADDRESS_COMMUNITY_HUMAN.
  grdt_address address_type;
  //! Generation index of the account key as defined by SLIP-0010. Index 1 is the first account and
  //! the only one allowed to receive creations.
  uint32_t derivation_index;
  //! 32-byte hash of the human-readable name.
  uint8_t name_hash[BLAKE2B_HASH_SIZE];
  //! SLIP-0010-derived Ed25519 public key of the account at the given derivation
  //! index.
  uint8_t account_pubkey[ED25519_PUBLIC_KEY_SIZE];
} grdw_register_address;

// functions for fill structures

/**
 * @brief Assemble a community friends update structure.
 *
 * Fills the community friends update with the color fusion flag. The structure
 * emerges ready to be included in a transaction.
 *
 * @param[out] community_friends_update Community friends update to populate.
 * @param[in]  color_fusion              Flag indicating whether color fusion is enabled.
 */
void grdw_community_friends_update_assemble(
    grdw_community_friends_update *community_friends_update, const bool color_fusion
);

/**
 * @brief Assemble the root identity of a Gradido community.
 *
 * Takes the three foundational public keys – the community root, the Common
 * Good pillar (Gemeinwohl), and the Compensation & Environment Fund pillar
 * (AUF) – and unites them into the single structure that anchors a community
 * in the cryptographic fabric of the network.
 *
 * @param[out] community_root Community root to populate.
 * @param[in]  pubkey         Community root public key (32-byte Ed25519). All
 *                            other in-community keys are derived from the
 *                            corresponding private key via SLIP-0010.
 * @param[in]  gmw_pubkey     Public key receiving Common Good (Gemeinwohl)
 *                            creation funds.
 * @param[in]  auf_pubkey     Public key receiving Compensation & Environment
 *                            Fund (AUF) creation funds.
 *
 * @whisper Three streams, one source – the community takes root
 */
void grdw_community_root_assemble(
    grdw_community_root *community_root,
    const uint8_t pubkey[ED25519_PUBLIC_KEY_SIZE],
    const uint8_t gmw_pubkey[ED25519_PUBLIC_KEY_SIZE],
    const uint8_t auf_pubkey[ED25519_PUBLIC_KEY_SIZE]
);

/**
 * @brief Assemble a creation transaction.
 *
 * Forms a new creation that allows value to emerge into the system. The
 * recipient, amount, and originating community define where new Gradidos
 * appear; the target date anchors this creation to a specific calendar month.
 * Each person may create at most 1,000 Gradidos per month, and the target
 * date declares which month's limit this creation counts toward.
 *
 * @param[out] gradido_creation       Creation structure to populate.
 * @param[in]  recipient_pubkey       Recipient's 32-byte Ed25519 public key.
 * @param[in]  amount                 Amount to create (fixed-point scaling 10^4).
 * @param[in]  community_uuid         16-byte UUID of the originating community.
 * @param[in]  target_date_seconds    Month anchor for the creation, seconds
 *                                    since epoch. The 1,000 GDD/month limit is
 *                                    enforced against this value.
 *
 * @whisper A seed planted in the past, blooming now
 */
void grdw_gradido_creation_assemble(
    grdw_gradido_creation *gradido_creation,
    const uint8_t recipient_pubkey[ED25519_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint64_t target_date_seconds
);

/**
 * @brief Assemble a transfer transaction.
 *
 * Prepares a transfer of Gradidos from a sender to a recipient. The
 * originating community UUID identifies which community's Gradidos are
 * being moved. Value stands ready to flow.
 *
 * @param[out] gradido_transfer  Transfer structure to populate.
 * @param[in]  sender_pubkey     Sender's 32-byte Ed25519 public key.
 * @param[in]  amount            Amount to transfer (fixed-point scaling 10^4).
 * @param[in]  community_uuid    16-byte UUID of the community where the GDD
 *                               were created.
 * @param[in]  recipient_pubkey  Recipient's 32-byte Ed25519 public key.
 *
 * @whisper Value in motion, from hand to hand
 */
void grdw_gradido_transfer_assemble(
    grdw_gradido_transfer *gradido_transfer,
    const uint8_t sender_pubkey[ED25519_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint8_t recipient_pubkey[ED25519_PUBLIC_KEY_SIZE]
);

/**
 * @brief Assemble a deferred transfer structure.
 *
 * Prepares a time-locked transfer that creates a redeemable one-way account.
 * The sender provides the full amount – the intended transfer sum plus the
 * decay reserve needed to cover the entire timeout duration. The transfer
 * waits, protected by time, until the recipient redeems it or the timeout
 * returns it.
 *
 * @param[out] gradido_deferred_transfer Deferred transfer to populate.
 * @param[in]  sender_pubkey             Sender's 32-byte Ed25519 public key.
 * @param[in]  amount                    Full amount including decay reserve
 *                                       (fixed-point scaling 10^4).
 * @param[in]  community_uuid            16-byte UUID of the originating community.
 * @param[in]  recipient_pubkey          Recipient's 32-byte Ed25519 public key.
 * @param[in]  timeout_duration          Timeout in seconds. The decay reserve
 *                                       is sized to cover exactly this duration.
 *
 * @whisper A locked door, waiting for the right key
 */
void grdw_gradido_deferred_transfer_assemble(
    grdw_gradido_deferred_transfer *gradido_deferred_transfer,
    const uint8_t sender_pubkey[ED25519_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint8_t recipient_pubkey[ED25519_PUBLIC_KEY_SIZE],
    const uint32_t timeout_duration
);

/**
 * @brief Assemble a redemption for a deferred transfer.
 *
 * Prepares the redemption of a previously created deferred transfer. The
 * original transaction is referenced by its number; the transfer specifies
 * the recipient and the amount to claim from the one-way account. Any
 * remaining decay reserve flows back to the original sender as change.
 *
 * @param[out] gradido_redeem_deferred_transfer Redemption structure to populate.
 * @param[in]  deferred_transfer_transaction_nr Transaction number of the
 *                                              original deferred transfer.
 * @param[in]  sender_pubkey                   Sender's 32-byte Ed25519 public
 *                                             key (the one-way account).
 * @param[in]  amount                          Amount being redeemed (fixed-point
 *                                             scaling 10^4).
 * @param[in]  community_uuid                  16-byte UUID of the originating
 *                                             community.
 * @param[in]  recipient_pubkey                Recipient's 32-byte Ed25519 public
 *                                             key.
 *
 * @whisper The lock opens, the surplus returns home
 */

void grdw_gradido_redeem_deferred_transfer_assemble(
    grdw_gradido_redeem_deferred_transfer *gradido_redeem_deferred_transfer,
    const uint64_t deferred_transfer_transaction_nr,
    const uint8_t sender_pubkey[ED25519_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint8_t recipient_pubkey[ED25519_PUBLIC_KEY_SIZE]
);

/**
 * @brief Assemble a timeout for a deferred transfer.
 *
 * Prepares the timeout reversal of a deferred transfer that was not redeemed
 * in time. References the original transaction by number. The entire remaining
 * balance of the one-way account returns to the sender.
 *
 * @param[out] gradido_timeout_deferred_transfer Timeout structure to populate.
 * @param[in]  deferred_transfer_transaction_nr  Transaction number of the
 *                                               original deferred transfer.
 *
 * @whisper The door closes, everything returns to its source
 */
void grdw_gradido_timeout_deferred_transfer_assemble(
    grdw_gradido_timeout_deferred_transfer *gradido_timeout_deferred_transfer,
    const uint64_t deferred_transfer_transaction_nr
);

/**
 * @brief Assemble an address registration structure.
 *
 * Prepares the registration that anchors a human identity to a cryptographic
 * account within a community. Account keys are derived from the user's
 * personal key following SLIP-0010. The derivation index starts at 1 for a
 * member's first account; only this first account with address type
 * GRDT_ADDRESS_COMMUNITY_HUMAN may receive creations.
 *
 * @param[out] register_address  Address registration to populate.
 * @param[in]  user_pubkey       User's 32-byte Ed25519 public key, the root
 *                               for all derived account keys.
 * @param[in]  address_type      Role of this address in the community.
 * @param[in]  derivation_index  SLIP-0010 derivation index of the account key.
 * @param[in]  name_hash         32-byte hash of the human-readable name.
 * @param[in]  account_pubkey    SLIP-0010-derived Ed25519 public key of the
 *                               account.
 *
 * @whisper A single root with the sole power to bloom
 */
void grdw_register_address_assemble(
    grdw_register_address *register_address,
    const uint8_t user_pubkey[ED25519_PUBLIC_KEY_SIZE],
    const grdt_address address_type,
    const uint32_t derivation_index,
    const uint8_t name_hash[BLAKE2B_HASH_SIZE],
    const uint8_t account_pubkey[ED25519_PUBLIC_KEY_SIZE]
);

/** @} */

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_DATA_WIRE_SPECIFIC_TRANSACTIONS_H
