#ifndef GRADIDO_BLOCKCHAIN_CORE_CRYPTO_GENERIC_HASH_H
#define GRADIDO_BLOCKCHAIN_CORE_CRYPTO_GENERIC_HASH_H

#ifdef __cplusplus
extern "C" {
#endif

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/result.h"

#include <stddef.h>
#include <stdint.h>

//! \param hash expect to be GENERIC_HASH_SIZE
grd_result grdc_generic_hash(uint8_t *hash, const uint8_t *data, size_t size);

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_CRYPTO_GENERIC_HASH_H
