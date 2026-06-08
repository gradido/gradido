#ifndef GRADIDO_BLOCKCHAIN_CORE_CRYPTO_SIGN_H
#define GRADIDO_BLOCKCHAIN_CORE_CRYPTO_SIGN_H

#ifdef __cplusplus
extern "C" {
#endif

#ifdef USE_SODIUM

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/result.h"

#include <stddef.h>
#include <stdint.h>

/** @defgroup crypto Cryptographic Primitives */
/** @defgroup grdc_sign grdc_sign
 *  @ingroup crypto
 *  @brief Ed25519 key pair management with SLIP-10 hierarchical derivation
 *  @{
 */

/**
 * @brief Ed25519 key pair with SLIP-10 hierarchical derivation support.
 *
 * Holds the cryptographic seed, public key, private key, and chain code
 * required for Ed25519 signature operations and SLIP-10 deterministic key
 * derivation. The union allows flexible access to either the seed+public key
 * components or the full private key, while the chain code enables hierarchical
 * derivation paths.
 *
 * The structure flows from a single entropy source through branching derivation
 * paths, each maintaining cryptographic isolation through the chain code.
 *
 * @var seed           32-byte entropy seed for key generation.
 * @var public_key     32-byte Ed25519 public key.
 * @var private_key    64-byte Ed25519 private key (seed + public key).
 * @var chain_code     32-byte chain code for SLIP-10 derivation.
 */
typedef struct grdc_sign_key_pair {
  union {
    struct {
      uint8_t seed[SIGN_SEED_SIZE];
      uint8_t public_key[SIGN_PUBLIC_KEY_SIZE];
    };
    uint8_t private_key[SIGN_PRIVATE_KEY_SIZE];
  };
  uint8_t chain_code[SIGN_CHAIN_CODE_SIZE];
} grdc_sign_key_pair;

/**
 * @brief Initialize an Ed25519 key pair to zero.
 *
 * Clears all fields of the key pair structure, setting seed, public key,
 * private key, and chain code to zero. This prepares the structure for
 * subsequent key generation or derivation operations.
 *
 * The structure settles into a neutral state, ready to receive cryptographic
 * life from entropy.
 *
 * @param[out] sign_key_pair  Pointer to the key pair to initialize. Must not be NULL.
 */
void grdc_sign_key_pair_init(grdc_sign_key_pair *sign_key_pair);

/**
 * @brief Generate an Ed25519 key pair from a seed using SLIP-10.
 *
 * Derives the master Ed25519 key pair from a seed following SLIP-10
 * specification. The seed must be at least 16 bytes and at most 64 bytes.
 * Generates the private key, public key, and chain code from the entropy
 * source. The output key pair can serve as the root for hierarchical
 * derivation.
 *
 * From a single seed of entropy, a tree of cryptographic identities emerges,
 * each branch deterministic yet isolated.
 *
 * @param[out] sign_key_pair  Pointer to the key pair to populate. Must not be NULL.
 * @param[in]  seed              Input seed bytes. Must not be NULL.
 * @param[in]  seed_size         Size of the seed in bytes. Must be between 16 and 64.
 * @return                       GRD_RESULT_SUCCESS on success, GRD_RESULT_INVALID_PARAMETER if
 * parameters are NULL or seed size is invalid.
 * @whisper From one seed, a forest of keys
 */
grd_result grdc_sign_key_pair_generate_from_seed(
    grdc_sign_key_pair *sign_key_pair, const uint8_t *seed, const size_t seed_size
);

/**
 * @brief Copy the Ed25519 public key in SLIP-10 format.
 *
 * Extracts the 32-byte Ed25519 public key from the key pair and copies it
 * into the output buffer with a leading 0x00 byte prefix, resulting in a
 * 33-byte SLIP-10 encoded public key. The prefix indicates the key type
 * in SLIP-10 serialization.
 *
 * The public key emerges from its private counterpart, wearing its SLIP-10
 * identifier like a signature of origin.
 *
 * @param[out] slip10_public_key  Output buffer of 33 bytes (SIGN_PUBLIC_KEY_SIZE + 1). Must not
 * be NULL.
 * @param[in]  sign_key_pair   Source key pair containing the public key. Must not be NULL.
 * @return                        GRD_RESULT_SUCCESS on success, GRD_RESULT_INVALID_PARAMETER if
 * parameters are NULL.
 */
grd_result grdc_sign_key_pair_copy_slip10_public_key(
    uint8_t slip10_public_key[SIGN_PUBLIC_KEY_SIZE + 1], const grdc_sign_key_pair *sign_key_pair
);

/**
 * @brief Derive a child key pair using SLIP-10 hierarchical derivation.
 *
 * Derives a child Ed25519 key pair from a parent key pair at the specified
 * index using SLIP-10 HMAC-based key derivation. The index determines the
 * derivation path branch. It will always be hardened, so it must stay below 0x80000000.
 * The output and parent may point to the same memory,
 * allowing in-place derivation.
 *
 * Each child branches from its parent along a numbered path, carrying forward
 * the chain of cryptographic descent while maintaining isolation from siblings.
 *
 * @param[out] sign_key_pair         Derived child key pair. Must not be NULL.
 * @param[in]  sign_parent_key_pair  Parent key pair for derivation. Must not be NULL.
 * @param[in]  index                    Derivation index (32-bit unsigned) < 0x80000000.
 * @return                              GRD_RESULT_SUCCESS on success, GRD_RESULT_INVALID_PARAMETER
 * if parameters are NULL.
 * @whisper A child grows from its parent's branch
 */
grd_result grdc_sign_key_pair_derive(
    grdc_sign_key_pair *sign_key_pair,
    const grdc_sign_key_pair *sign_parent_key_pair,
    const uint32_t index
);

/**
 * @brief Derive a user-specific child key pair from a parent.
 *
 * Derives a child Ed25519 key pair specifically for a user identified by UUID.
 * The UUID serves as the derivation index material, ensuring each user receives
 * a unique cryptographic identity derived from the parent key. This enables
 * per-user key isolation within a hierarchical structure.
 *
 * The UUID seeds a unique path for each user, their cryptographic identity
 * flowing from the parent through the identifier of their existence.
 *
 * @param[out] sign_key_pair  Derived user-specific key pair. Must not be NULL.
 * @param[in]  sign_parent_key Parent key pair for derivation. Must not be NULL.
 * @param[in]  uuid            16-byte UUID. Must not be NULL.
 * @return                     GRD_RESULT_SUCCESS on success, GRD_RESULT_INVALID_PARAMETER if
 * parameters are NULL.
 * @whisper Each user walks their own path
 */
grd_result grdc_sign_key_pair_derive_uuid(
    grdc_sign_key_pair *sign_key_pair,
    const grdc_sign_key_pair *sign_parent_key,
    const uint8_t uuid[UUID_BINARY_SIZE]
);

/**
 * @brief Derive an account child key from community seed and user UUID.
 *
 * Performs a full derivation path starting from the community root seed,
 * deriving through the user UUID to arrive at a specific account key. The
 * account_index selects the account within the user's hierarchy, starting
 * from 1. This combines community, user, and account context into a single
 * deterministic key.
 *
 * From the community's root seed, through the user's identifier, to the
 * numbered account—a complete descent from collective to individual.
 *
 * @param[out] sign_key_pair       Derived account key pair. Must not be NULL.
 * @param[in]  community_root_seed    32-byte community root seed. Must not be NULL.
 * @param[in]  user_uuid              16-byte UUID identifying the user. Must not be NULL.
 * @param[in]  account_index          Account index starting from 1.
 * @return                            GRD_RESULT_SUCCESS on success, GRD_RESULT_INVALID_PARAMETER if
 * parameters are NULL or account_index is 0.
 * @whisper From community to user to account, the path unfolds
 */
grd_result grdc_sign_key_pair_derive_account_from_community(
    grdc_sign_key_pair *sign_key_pair,
    const uint8_t community_root_seed[SIGN_SEED_SIZE],
    const uint8_t user_uuid[UUID_BINARY_SIZE],
    const uint32_t account_index
);

/** @} */

#endif // USE_SODIUM

#ifdef __cplusplus
}
#endif

#endif // GRADIDO_BLOCKCHAIN_CORE_CRYPTO_SIGN_H
