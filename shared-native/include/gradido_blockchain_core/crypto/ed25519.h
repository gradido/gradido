#ifndef GRADIDO_BLOCKCHAIN_CORE_CRYPTO_ED25519_H
#define GRADIDO_BLOCKCHAIN_CORE_CRYPTO_ED25519_H

#ifdef __cplusplus
extern "C" {
#endif

#ifdef USE_SODIUM

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/result.h"

#include <stdint.h>

typedef struct grdc_ed25519_key_pair {
  union {
    struct {
      uint8_t seed[ED25519_SEED_SIZE];
      uint8_t public_key[ED25519_PUBLIC_KEY_SIZE];
    };
    uint8_t private_key[ED25519_PRIVATE_KEY_SIZE];
  };
  uint8_t chain_code[ED25519_CHAIN_CODE_SIZE];
} grdc_ed25519_key_pair;

void grdc_ed25519_key_pair_init(grdc_ed25519_key_pair *ed25519_key_pair);
// seed generation like described in slip0010
grd_result grdc_ed25519_key_pair_generate_from_seed(
    grdc_ed25519_key_pair *ed25519_key_pair, const uint8_t *seed, const size_t seed_size
);

grd_result grdc_ed25519_key_pair_copy_slip10_public_key(
    uint8_t slip10_public_key[ED25519_PUBLIC_KEY_SIZE + 1],
    const grdc_ed25519_key_pair *ed25519_key_pair
);

//! ed25519_key_pair and ed25519_parent_key_pair can be pointing on the same memory
grd_result ed25519_key_pair_slip10_derive_child(
    grdc_ed25519_key_pair *ed25519_key_pair,
    const grdc_ed25519_key_pair *ed25519_parent_key_pair,
    const uint32_t index
);

grd_result ed25519_key_pair_slip10_derive_user_child_key(
    grdc_ed25519_key_pair *ed25519_key_pair,
    const grdc_ed25519_key_pair *ed25519_parent_key,
    const uint8_t user_uuid[UUID_BINARY_SIZE]
);

//! @param index account_index starting by 1
grd_result ed25519_key_pair_slip10_derive_account_child_key_full(
    grdc_ed25519_key_pair *ed25519_key_pair,
    const uint8_t community_root_seed[ED25519_SEED_SIZE],
    const uint8_t user_uuid[UUID_BINARY_SIZE],
    const uint32_t account_index
);

#endif // USE_SODIUM

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_CRYPTO_ED25519_H
