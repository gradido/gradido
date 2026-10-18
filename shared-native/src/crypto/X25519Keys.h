// AI-GENERATED — not an architecture reference
#pragma once

#include "Keys.h"

namespace gradido::crypto {

    enum class DecryptResult {
        SUCCESS,
        // shorter than the format's overhead
        MALFORMED_CIPHERTEXT,
        // the format byte is not the one expected
        UNKNOWN_VERSION,
        // altered, or not encrypted for these keys
        DECRYPT_FAILED,
    };

    /**
     * An X25519 key pair for authenticated encryption, free of Node-API.
     *
     * encrypt/decrypt are libsodium's crypto_box between these keys (with private key) and a
     * peer's public key. encryptSecret/decryptSecret are for these keys alone: a key derived
     * from the private key with crypto_kdf, XChaCha20-Poly1305 over the payload.
     *
     * Every ciphertext starts with a format byte (FORMAT_BOX or FORMAT_SECRET), then the 24
     * bytes nonce, then ciphertext and 16 bytes MAC: overhead(format) bytes beside the payload.
     *
     * The caller allocates the output, so it can land where it is wanted (a Node Buffer) without
     * a copy: overhead(format) + payload size to encrypt, box size - overhead(format) to decrypt,
     * the latter only after checkCiphertext() answered SUCCESS. Every method but checkCiphertext
     * and the public key needs the private key.
     */
    class X25519Keys : public Keys {
    public:
        static constexpr size_t SEED_SIZE = 32;
        static constexpr uint8_t FORMAT_BOX = 1;
        static constexpr uint8_t FORMAT_SECRET = 2;

        X25519Keys() = default;

        // privateKey may be null; see Keys::set
        KeyResult set(const uint8_t publicKey[PUBLIC_KEY_SIZE], const uint8_t* privateKey);
        // random without a seed (null), else deterministic (crypto_box_seed_keypair)
        KeyResult generate(const uint8_t* seed);

        // the bytes a ciphertext of this format takes beside the payload
        static size_t overhead(uint8_t format);
        // long enough, and of the expected format; what every decrypt checks before it starts
        static DecryptResult checkCiphertext(const uint8_t* box, size_t boxSize, uint8_t format);

        // false only for a peer public key of low order, which no honest key pair has
        bool encrypt(uint8_t* box, const uint8_t* payload, size_t payloadSize, const uint8_t peerPublicKey[PUBLIC_KEY_SIZE]) const;
        // SUCCESS or DECRYPT_FAILED; checkCiphertext first
        DecryptResult decrypt(uint8_t* payload, const uint8_t* box, size_t boxSize, const uint8_t peerPublicKey[PUBLIC_KEY_SIZE]) const;
        void encryptSecret(uint8_t* box, const uint8_t* payload, size_t payloadSize) const;
        // SUCCESS or DECRYPT_FAILED; checkCiphertext first
        DecryptResult decryptSecret(uint8_t* payload, const uint8_t* box, size_t boxSize) const;

    private:
        // the key encryptSecret/decryptSecret use, derived from the private key
        void deriveSecretKey(uint8_t* key) const;
    };

} // namespace gradido::crypto
