#ifdef USE_SODIUM
#include "gradido_blockchain_core/crypto/hash.h"
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/crypto/hash_sodium_compat.h"

#include "sodium.h"

grd_result grdc_hash_generic(uint8_t *hash, const uint8_t *data, size_t size) {
  if (!hash || !data) { return GRD_ERROR_NULL_POINTER; }
  if (!size) { return GRD_ERROR_INVALID_PARAM; }
  crypto_generichash(hash, GENERIC_HASH_SIZE, data, size, NULL, 0);
  return GRD_SUCCESS;
}
#endif // USE_SODIUM
