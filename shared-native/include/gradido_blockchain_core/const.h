#ifndef GRADIDO_BLOCKCHAIN_CORE_CONST_H
#define GRADIDO_BLOCKCHAIN_CORE_CONST_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define SIGN_PUBLIC_KEY_SIZE 32
#define SIGN_SEED_SIZE 32
#define SIGN_CHAIN_CODE_SIZE 32
#define SIGN_PRIVATE_KEY_SIZE 64
#define SIGN_SIGNATURE_SIZE 64
#define GENERIC_HASH_SIZE 32
#define UUID_BINARY_SIZE 16
const static int MAGIC_NUMBER_MAX_TIMESPAN_BETWEEN_CREATING_AND_RECEIVING_TRANSACTION_SECONDS = 120;
const static int64_t GRADIDO_DECAY_RESPITE_CENT = 100;

// for ffi
int grdc_sign_public_key_size();
int grdc_sign_seed_size();
int grdc_sign_chain_code_size();
int grdc_sign_private_key_size();
int grdc_sign_signature_size();
int grdc_generic_hash_size();
int grdc_uuid_binary_size();
int64_t grdc_decay_respite_cent();

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_CONST_H
