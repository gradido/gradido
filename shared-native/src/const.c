#include "gradido_blockchain_core/const.h"

#include <stdint.h>

// for ffi
int grdc_sign_public_key_size() {
  return SIGN_PUBLIC_KEY_SIZE;
}
int grdc_sign_seed_size() {
  return SIGN_SEED_SIZE;
}
int grdc_sign_chain_code_size() {
  return SIGN_CHAIN_CODE_SIZE;
}
int grdc_sign_private_key_size() {
  return SIGN_PRIVATE_KEY_SIZE;
}
int grdc_sign_signature_size() {
  return SIGN_SIGNATURE_SIZE;
}
int grdc_generic_hash_size() {
  return GENERIC_HASH_SIZE;
}
int grdc_uuid_binary_size() {
  return UUID_BINARY_SIZE;
}
int64_t grdc_decay_respite_cent() {
  return GRADIDO_DECAY_RESPITE_CENT;
}
