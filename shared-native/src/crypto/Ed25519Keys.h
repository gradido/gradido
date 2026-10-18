// AI-GENERATED — not an architecture reference
#pragma once

#include "Keys.h"

namespace gradido::crypto {

    /**
     * An Ed25519 key pair, free of Node-API. Plain libsodium keys, not SLIP-10. The private key
     * is the 32 bytes seed only; libsodium's 64 bytes form (seed and public key) is put together
     * on the stack for sign, so the public key is not kept twice.
     */
    class Ed25519Keys : public Keys {
    public:
        static constexpr size_t SEED_SIZE = 32;
        static constexpr size_t SIGNATURE_SIZE = 64;

        Ed25519Keys() = default;

        // privateKey (the seed) may be null; see Keys::set
        KeyResult set(const uint8_t publicKey[PUBLIC_KEY_SIZE], const uint8_t* privateKey);
        // random without a seed (null), else deterministic (crypto_sign_seed_keypair)
        KeyResult generate(const uint8_t* seed);

        // needs the private key
        void sign(uint8_t signature[SIGNATURE_SIZE], const uint8_t* message, size_t messageSize) const;
        bool verify(const uint8_t signature[SIGNATURE_SIZE], const uint8_t* message, size_t messageSize) const;
    };

} // namespace gradido::crypto
