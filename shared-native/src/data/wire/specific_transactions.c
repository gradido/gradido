#include "gradido_blockchain_core/data/wire/specific_transactions.h"
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/types/address.h"

#include <string.h>

void grdw_community_friends_update_assemble(
    grdw_community_friends_update *community_friends_update, const bool color_fusion
) {
  if (!community_friends_update) { return; }
  community_friends_update->color_fusion = color_fusion;
}

void grdw_community_root_assemble(
    grdw_community_root *community_root,
    const uint8_t pubkey[SIGN_PUBLIC_KEY_SIZE],
    const uint8_t gmw_pubkey[SIGN_PUBLIC_KEY_SIZE],
    const uint8_t auf_pubkey[SIGN_PUBLIC_KEY_SIZE]
) {
  if (!community_root || !pubkey || !gmw_pubkey || !auf_pubkey) { return; }
  memcpy(community_root->pubkey, pubkey, SIGN_PUBLIC_KEY_SIZE);
  memcpy(community_root->gmw_pubkey, gmw_pubkey, SIGN_PUBLIC_KEY_SIZE);
  memcpy(community_root->auf_pubkey, auf_pubkey, SIGN_PUBLIC_KEY_SIZE);
}

void grdw_gradido_creation_assemble(
    grdw_gradido_creation *gradido_creation,
    const uint8_t recipient_pubkey[SIGN_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint64_t target_date_seconds
) {
  if (!gradido_creation || !recipient_pubkey || !community_uuid) { return; }
  memcpy(gradido_creation->recipient.pubkey, recipient_pubkey, SIGN_PUBLIC_KEY_SIZE);
  gradido_creation->recipient.amount = amount;
  memcpy(gradido_creation->recipient.community_uuid, community_uuid, UUID_BINARY_SIZE);
  gradido_creation->target_date.seconds = target_date_seconds;
}

void grdw_gradido_transfer_assemble(
    grdw_gradido_transfer *gradido_transfer,
    const uint8_t sender_pubkey[SIGN_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint8_t recipient_pubkey[SIGN_PUBLIC_KEY_SIZE]
) {
  if (!gradido_transfer || !sender_pubkey || !community_uuid || !recipient_pubkey) { return; }
  memcpy(gradido_transfer->sender.pubkey, sender_pubkey, SIGN_PUBLIC_KEY_SIZE);
  gradido_transfer->sender.amount = amount;
  memcpy(gradido_transfer->sender.community_uuid, community_uuid, UUID_BINARY_SIZE);
  memcpy(gradido_transfer->recipient, recipient_pubkey, SIGN_PUBLIC_KEY_SIZE);
}

void grdw_gradido_deferred_transfer_assemble(
    grdw_gradido_deferred_transfer *gradido_deferred_transfer,
    const uint8_t sender_pubkey[SIGN_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint8_t recipient_pubkey[SIGN_PUBLIC_KEY_SIZE],
    const uint32_t timeout_duration
) {
  if (!gradido_deferred_transfer || !sender_pubkey || !community_uuid || !recipient_pubkey) {
    return;
  }
  memcpy(gradido_deferred_transfer->transfer.sender.pubkey, sender_pubkey, SIGN_PUBLIC_KEY_SIZE);
  gradido_deferred_transfer->transfer.sender.amount = amount;
  memcpy(
      gradido_deferred_transfer->transfer.sender.community_uuid, community_uuid, UUID_BINARY_SIZE
  );
  memcpy(gradido_deferred_transfer->transfer.recipient, recipient_pubkey, SIGN_PUBLIC_KEY_SIZE);
  gradido_deferred_transfer->timeout_duration = timeout_duration;
}

void grdw_gradido_redeem_deferred_transfer_assemble(
    grdw_gradido_redeem_deferred_transfer *gradido_redeem_deferred_transfer,
    const uint64_t deferred_transfer_transaction_nr,
    const uint8_t sender_pubkey[SIGN_PUBLIC_KEY_SIZE],
    const int64_t amount,
    const uint8_t community_uuid[UUID_BINARY_SIZE],
    const uint8_t recipient_pubkey[SIGN_PUBLIC_KEY_SIZE]
) {
  if (!gradido_redeem_deferred_transfer || !sender_pubkey || !community_uuid || !recipient_pubkey) {
    return;
  }
  gradido_redeem_deferred_transfer->deferred_transfer_transaction_nr =
      deferred_transfer_transaction_nr;
  memcpy(
      gradido_redeem_deferred_transfer->transfer.sender.pubkey, sender_pubkey, SIGN_PUBLIC_KEY_SIZE
  );
  gradido_redeem_deferred_transfer->transfer.sender.amount = amount;
  memcpy(
      gradido_redeem_deferred_transfer->transfer.sender.community_uuid, community_uuid,
      UUID_BINARY_SIZE
  );
  memcpy(
      gradido_redeem_deferred_transfer->transfer.recipient, recipient_pubkey, SIGN_PUBLIC_KEY_SIZE
  );
}

void grdw_gradido_timeout_deferred_transfer_assemble(
    grdw_gradido_timeout_deferred_transfer *gradido_timeout_deferred_transfer,
    const uint64_t deferred_transfer_transaction_nr
) {
  if (!gradido_timeout_deferred_transfer) { return; }
  gradido_timeout_deferred_transfer->deferred_transfer_transaction_nr =
      deferred_transfer_transaction_nr;
}

void grdw_register_address_assemble(
    grdw_register_address *register_address,
    const uint8_t user_pubkey[SIGN_PUBLIC_KEY_SIZE],
    const grdt_address address_type,
    const uint32_t derivation_index,
    const uint8_t name_hash[GENERIC_HASH_SIZE],
    const uint8_t account_pubkey[SIGN_PUBLIC_KEY_SIZE]
) {
  if (!register_address || !user_pubkey || !name_hash || !account_pubkey) { return; }
  memcpy(register_address->user_pubkey, user_pubkey, SIGN_PUBLIC_KEY_SIZE);
  register_address->address_type = address_type;
  register_address->derivation_index = derivation_index;
  memcpy(register_address->name_hash, name_hash, GENERIC_HASH_SIZE);
  memcpy(register_address->account_pubkey, account_pubkey, SIGN_PUBLIC_KEY_SIZE);
}
