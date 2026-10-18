// AI-GENERATED — not an architecture reference
#include "Ed25519Keys.h"

#include <sodium.h>

#include <cstring>

namespace gradido::crypto {

    static_assert(crypto_sign_PUBLICKEYBYTES == Keys::PUBLIC_KEY_SIZE, "Ed25519 public key fits Keys");
    static_assert(crypto_sign_SEEDBYTES == Keys::PRIVATE_KEY_SIZE, "the Ed25519 seed is the private key Keys holds");
    static_assert(crypto_sign_SEEDBYTES == Ed25519Keys::SEED_SIZE, "Ed25519 seed size");
    static_assert(crypto_sign_BYTES == Ed25519Keys::SIGNATURE_SIZE, "Ed25519 signature size");

    namespace {
        // the public key of a seed; libsodium's 64 bytes secret key, which comes along, is dropped
        int derivePublicKey(uint8_t* publicKey, const uint8_t* seed)
        {
            uint8_t secretKey[crypto_sign_SECRETKEYBYTES];
            crypto_sign_seed_keypair(publicKey, secretKey, seed);
            sodium_memzero(secretKey, sizeof(secretKey));
            // every seed has a public key
            return 0;
        }

        // for Keys::generate, which writes privateKey straight into the private key memory: only the seed is kept
        int randomKeyPair(uint8_t* publicKey, uint8_t* privateKey)
        {
            randombytes_buf(privateKey, crypto_sign_SEEDBYTES);
            derivePublicKey(publicKey, privateKey);
            return 0;
        }

        int seedKeyPair(uint8_t* publicKey, uint8_t* privateKey, const uint8_t* seed)
        {
            memcpy(privateKey, seed, crypto_sign_SEEDBYTES);
            derivePublicKey(publicKey, privateKey);
            return 0;
        }
    } // namespace

    KeyResult Ed25519Keys::set(const uint8_t publicKey[PUBLIC_KEY_SIZE], const uint8_t* privateKey)
    {
        return Keys::set(publicKey, privateKey, derivePublicKey);
    }

    KeyResult Ed25519Keys::generate(const uint8_t* seed)
    {
        return Keys::generate(seed, randomKeyPair, seedKeyPair);
    }

    void Ed25519Keys::sign(uint8_t signature[SIGNATURE_SIZE], const uint8_t* message, size_t messageSize) const
    {
        // libsodium's secret key is seed and public key; put together only for the call
        uint8_t secretKey[crypto_sign_SECRETKEYBYTES];
        memcpy(secretKey, mPrivateKey, crypto_sign_SEEDBYTES);
        memcpy(secretKey + crypto_sign_SEEDBYTES, mPublicKey, PUBLIC_KEY_SIZE);
        crypto_sign_detached(signature, nullptr, message, messageSize, secretKey);
        sodium_memzero(secretKey, sizeof(secretKey));
    }

    bool Ed25519Keys::verify(const uint8_t signature[SIGNATURE_SIZE], const uint8_t* message, size_t messageSize) const
    {
        return crypto_sign_verify_detached(signature, message, messageSize, mPublicKey) == 0;
    }

} // namespace gradido::crypto
