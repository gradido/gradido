#ifndef GRADIDO_BLOCKCHAIN_CORE_CRYPTO_GENERIC_HASH_H
#define GRADIDO_BLOCKCHAIN_CORE_CRYPTO_GENERIC_HASH_H

#ifdef __cplusplus
extern "C" {
#endif

#ifdef USE_SODIUM

#include "gradido_blockchain_core/result.h"

#include <stddef.h>
#include <stdint.h>

//! \param hash expect to be GENERIC_HASH_SIZE
grd_result grdc_hash_generic(uint8_t *hash, const uint8_t *data, size_t size);

#endif // USE_SODIUM

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_CRYPTO_GENERIC_HASH_H
