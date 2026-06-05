#ifdef USE_SODIUM

#include "gradido_blockchain_core/crypto/ed25519.h"
// make sure sodium expected key and seed size wasn't changed
#include "gradido_blockchain_core/crypto/ed25519_sodium_compat.h"
#include "gradido_blockchain_core/result.h"

#include "sodium.h"

#include <string.h>

#define HARDENED_KEY_BITMASK 0x80000000

void grdc_ed25519_key_pair_init(grdc_ed25519_key_pair *ed25519_key_pair) {
  if (!ed25519_key_pair) { return; }
  memset(ed25519_key_pair, 0, sizeof(ed25519_key_pair));
}

grd_result grdc_ed25519_key_pair_generate_from_seed(
    grdc_ed25519_key_pair *ed25519_key_pair, const uint8_t *seed, const size_t seed_size
) {
  if (!ed25519_key_pair || !seed) { return GRD_ERROR_NULL_POINTER; }
  if (!seed_size) { return GRD_ERROR_INVALID_PARAM; }
  const uint8_t curveId[] = "ed25519 seed";
  uint8_t I[64];
  uint8_t temp[32];

  crypto_auth_hmacsha512_state state;
  crypto_auth_hmacsha512_init(&state, curveId, sizeof(curveId) - 1);
  crypto_auth_hmacsha512_update(&state, seed, seed_size);
  crypto_auth_hmacsha512_final(&state, I);

  crypto_sign_seed_keypair(temp, ed25519_key_pair->private_key, I);
  memcpy(ed25519_key_pair->chain_code, &I[32], ED25519_CHAIN_CODE_SIZE);
  return GRD_SUCCESS;
}

grd_result grdc_ed25519_key_pair_copy_slip10_public_key(
    uint8_t slip10_public_key[ED25519_PUBLIC_KEY_SIZE + 1],
    const grdc_ed25519_key_pair *ed25519_key_pair
) {
  if (!slip10_public_key || !ed25519_key_pair) { return GRD_ERROR_NULL_POINTER; }
  slip10_public_key[0] = 0x00;
  memcpy(slip10_public_key + 1, ed25519_key_pair->public_key, ED25519_PUBLIC_KEY_SIZE);
  return GRD_SUCCESS;
}

grd_result ed25519_key_pair_slip10_derive_child(
    grdc_ed25519_key_pair *ed25519_key_pair,
    const grdc_ed25519_key_pair *ed25519_parent_key_pair,
    const uint32_t index
) {
  if (!ed25519_key_pair || !ed25519_parent_key_pair) { return GRD_ERROR_NULL_POINTER; }
  if (index < HARDENED_KEY_BITMASK) { return GRD_ERROR_INVALID_PARAM; }

  uint8_t data[1 + 32 + 4];

  // 0x00
  data[0] = 0;

  // key
  memcpy(data + 1, ed25519_parent_key_pair->seed, 32);

  // index (big endian!)
  data[33] = (index >> 24) & 0xFF;
  data[34] = (index >> 16) & 0xFF;
  data[35] = (index >> 8) & 0xFF;
  data[36] = index & 0xFF;

  uint8_t I[64];

  crypto_auth_hmacsha512_state state;
  crypto_auth_hmacsha512_init(&state, ed25519_parent_key_pair->chain_code, ED25519_CHAIN_CODE_SIZE);
  crypto_auth_hmacsha512_update(&state, data, sizeof(data));
  crypto_auth_hmacsha512_final(&state, I);

  uint8_t temp[ED25519_PUBLIC_KEY_SIZE];

  crypto_sign_seed_keypair(temp, ed25519_key_pair->private_key, I);
  memcpy(ed25519_key_pair->chain_code, &I[32], ED25519_CHAIN_CODE_SIZE);
  return GRD_SUCCESS;
}

inline static uint32_t harden_derivation_key(const uint32_t index) {
  return (index | HARDENED_KEY_BITMASK) >> 0;
}

grd_result ed25519_key_pair_slip10_derive_user_child_key(
    grdc_ed25519_key_pair *ed25519_key_pair,
    const grdc_ed25519_key_pair *ed25519_parent_key,
    const uint8_t user_uuid[UUID_BINARY_SIZE]
) {
  if (!ed25519_key_pair || !ed25519_parent_key || !user_uuid) { return GRD_ERROR_NULL_POINTER; }
  grd_result result = GRD_SUCCESS;
  // user key
  for (int i = 0; i < 4; i++) {
    uint32_t word;
    memcpy(&word, &user_uuid[i * 4], sizeof(uint32_t));
    uint32_t harden_index = harden_derivation_key(word);
    if (0 == i) {
      result =
          ed25519_key_pair_slip10_derive_child(ed25519_key_pair, ed25519_parent_key, harden_index);
    } else {
      result =
          ed25519_key_pair_slip10_derive_child(ed25519_key_pair, ed25519_key_pair, harden_index);
    }
    if (result != GRD_SUCCESS) { return result; }
  }
  return result;
}

grd_result ed25519_key_pair_slip10_derive_account_child_key_full(
    grdc_ed25519_key_pair *ed25519_key_pair,
    const uint8_t community_root_seed[ED25519_SEED_SIZE],
    const uint8_t user_uuid[UUID_BINARY_SIZE],
    const uint32_t account_index
) {
  if (!ed25519_key_pair || !community_root_seed || !user_uuid) { return GRD_ERROR_NULL_POINTER; }
  if (!account_index || account_index >= HARDENED_KEY_BITMASK) { return GRD_ERROR_INVALID_PARAM; }
  // community root key
  grd_result result = grdc_ed25519_key_pair_generate_from_seed(
      ed25519_key_pair, community_root_seed, ED25519_SEED_SIZE
  );
  if (result != GRD_SUCCESS) { return result; }

  // user key
  for (int i = 0; i < 4; i++) {
    uint32_t word;
    memcpy(&word, &user_uuid[i * 4], sizeof(uint32_t));
    uint32_t harden_index = harden_derivation_key(word);
    result = ed25519_key_pair_slip10_derive_child(ed25519_key_pair, ed25519_key_pair, harden_index);
    if (result != GRD_SUCCESS) { return result; }
  }

  // account
  result = ed25519_key_pair_slip10_derive_child(
      ed25519_key_pair, ed25519_key_pair, harden_derivation_key(account_index)
  );
  return result;
}

#endif //USE_SODIUM
