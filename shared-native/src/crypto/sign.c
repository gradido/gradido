#ifdef USE_SODIUM

#include "gradido_blockchain_core/crypto/sign.h"
// make sure sodium expected key and seed size wasn't changed
#include "gradido_blockchain_core/crypto/sign_sodium_compat.h"
#include "gradido_blockchain_core/result.h"

#include "sodium.h"

#include <string.h>

// needed for ntohl
#ifdef _WIN32
#include <winsock.h>
#else
#include <arpa/inet.h>
#endif

#define HARDENED_KEY_BITMASK 0x80000000

void grdc_sign_key_pair_init(grdc_sign_key_pair *sign_key_pair) {
  if (!sign_key_pair) { return; }
  memset(sign_key_pair, 0, sizeof(sign_key_pair));
}

grd_result grdc_sign_key_pair_generate_from_seed(
    grdc_sign_key_pair *sign_key_pair, const uint8_t *seed, const size_t seed_size
) {
  if (!sign_key_pair || !seed) { return GRD_ERROR_NULL_POINTER; }
  if (!seed_size) { return GRD_ERROR_INVALID_PARAM; }
  const uint8_t curveId[] = "ed25519 seed";
  uint8_t I[64];
  uint8_t temp[32];

  crypto_auth_hmacsha512_state state;
  crypto_auth_hmacsha512_init(&state, curveId, sizeof(curveId) - 1);
  crypto_auth_hmacsha512_update(&state, seed, seed_size);
  crypto_auth_hmacsha512_final(&state, I);

  crypto_sign_seed_keypair(temp, sign_key_pair->private_key, I);
  memcpy(sign_key_pair->chain_code, &I[32], SIGN_CHAIN_CODE_SIZE);
  return GRD_SUCCESS;
}

grd_result grdc_sign_key_pair_copy_slip10_public_key(
    uint8_t slip10_public_key[SIGN_PUBLIC_KEY_SIZE + 1], const grdc_sign_key_pair *sign_key_pair
) {
  if (!slip10_public_key || !sign_key_pair) { return GRD_ERROR_NULL_POINTER; }
  slip10_public_key[0] = 0x00;
  memcpy(slip10_public_key + 1, sign_key_pair->public_key, SIGN_PUBLIC_KEY_SIZE);
  return GRD_SUCCESS;
}

grd_result grdc_sign_key_pair_derive(
    grdc_sign_key_pair *sign_key_pair,
    const grdc_sign_key_pair *sign_parent_key_pair,
    const uint32_t index
) {
  if (!sign_key_pair || !sign_parent_key_pair) { return GRD_ERROR_NULL_POINTER; }
  if (index >= HARDENED_KEY_BITMASK) { return GRD_ERROR_INVALID_PARAM; }
  uint32_t harden_index = (index | HARDENED_KEY_BITMASK) >> 0;

  uint8_t data[1 + 32 + 4];

  // 0x00
  data[0] = 0;

  // key
  memcpy(data + 1, sign_parent_key_pair->seed, 32);

  // index (big endian!)
  data[33] = (harden_index >> 24) & 0xFF;
  data[34] = (harden_index >> 16) & 0xFF;
  data[35] = (harden_index >> 8) & 0xFF;
  data[36] = harden_index & 0xFF;

  uint8_t I[64];

  crypto_auth_hmacsha512_state state;
  crypto_auth_hmacsha512_init(&state, sign_parent_key_pair->chain_code, SIGN_CHAIN_CODE_SIZE);
  crypto_auth_hmacsha512_update(&state, data, sizeof(data));
  crypto_auth_hmacsha512_final(&state, I);

  uint8_t temp[SIGN_PUBLIC_KEY_SIZE];

  crypto_sign_seed_keypair(temp, sign_key_pair->private_key, I);
  memcpy(sign_key_pair->chain_code, &I[32], SIGN_CHAIN_CODE_SIZE);
  return GRD_SUCCESS;
}

grd_result grdc_sign_key_pair_derive_uuid(
    grdc_sign_key_pair *sign_key_pair,
    const grdc_sign_key_pair *sign_parent_key,
    const uint8_t user_uuid[UUID_BINARY_SIZE]
) {
  if (!sign_key_pair || !sign_parent_key || !user_uuid) { return GRD_ERROR_NULL_POINTER; }
  grd_result result = GRD_SUCCESS;
  // user key
  for (int i = 0; i < 4; i++) {
    uint32_t word;
    memcpy(&word, &user_uuid[i * 4], sizeof(uint32_t));
    word = ntohl(word); // Network-to-Host: convert from Big-Endian to Little-Endian
    if (word >= HARDENED_KEY_BITMASK) { word -= HARDENED_KEY_BITMASK; }
    if (0 == i) {
      result = grdc_sign_key_pair_derive(sign_key_pair, sign_parent_key, word);
    } else {
      result = grdc_sign_key_pair_derive(sign_key_pair, sign_key_pair, word);
    }
    if (result != GRD_SUCCESS) { return result; }
  }
  return result;
}

grd_result grdc_sign_key_pair_derive_account_from_community(
    grdc_sign_key_pair *sign_key_pair,
    const uint8_t community_root_seed[SIGN_SEED_SIZE],
    const uint8_t user_uuid[UUID_BINARY_SIZE],
    const uint32_t account_index
) {
  if (!sign_key_pair || !community_root_seed || !user_uuid) { return GRD_ERROR_NULL_POINTER; }
  if (!account_index) { return GRD_ERROR_INVALID_PARAM; }
  // community root key
  grd_result result =
      grdc_sign_key_pair_generate_from_seed(sign_key_pair, community_root_seed, SIGN_SEED_SIZE);
  if (result != GRD_SUCCESS) { return result; }

  // user key
  result = grdc_sign_key_pair_derive_uuid(sign_key_pair, sign_key_pair, user_uuid);
  if (result != GRD_SUCCESS) { return result; }

  // account
  result = grdc_sign_key_pair_derive(sign_key_pair, sign_key_pair, account_index);
  return result;
}

#endif // USE_SODIUM
