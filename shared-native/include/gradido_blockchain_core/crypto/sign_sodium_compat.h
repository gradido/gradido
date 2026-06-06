#ifndef GRADIDO_BLOCKCHAIN_CORE_CRYPTO_SIGN_SODIUM_COMPAT_H
#define GRADIDO_BLOCKCHAIN_CORE_CRYPTO_SIGN_SODIUM_COMPAT_H

#ifdef __cplusplus
extern "C" {
#endif

#ifdef USE_SODIUM

#include "gradido_blockchain_core/const.h"

#include "sodium.h"

#include <assert.h>

/*
 * C11 static assert fallback safety
 */
#if !defined(static_assert)
#define static_assert _Static_assert
#endif

static_assert(
    SIGN_PUBLIC_KEY_SIZE == crypto_sign_PUBLICKEYBYTES,
    "sodium sign public key size don't match ed25519 public key size"
);
static_assert(
    SIGN_SEED_SIZE == crypto_sign_SEEDBYTES, "sodium sign seed size don't match ed25519 seed size"
);
static_assert(
    SIGN_PRIVATE_KEY_SIZE == crypto_sign_SECRETKEYBYTES,
    "sodium sign private key size don't match ed25519 private key size"
);
static_assert(
    SIGN_SIGNATURE_SIZE == crypto_sign_BYTES,
    "sodium sign signature size don't match ed25519 signature size"
);

#endif // USE_SODIUM

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_CRYPTO_SIGN_SODIUM_COMPAT_H
