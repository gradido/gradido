// AI-GENERATED — not an architecture reference
#include "X25519Keys.h"

#include <sodium.h>

namespace gradido::crypto {

    static_assert(crypto_box_PUBLICKEYBYTES == Keys::PUBLIC_KEY_SIZE, "X25519 public key fits Keys");
    static_assert(crypto_box_SECRETKEYBYTES == Keys::PRIVATE_KEY_SIZE, "X25519 private key fits Keys");
    static_assert(crypto_box_SEEDBYTES == X25519Keys::SEED_SIZE, "X25519 seed size");

    namespace {
        constexpr size_t BOX_HEADER_SIZE = 1 + crypto_box_NONCEBYTES;
        constexpr size_t BOX_OVERHEAD = BOX_HEADER_SIZE + crypto_box_MACBYTES;
        constexpr size_t SECRET_HEADER_SIZE = 1 + crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
        constexpr size_t SECRET_OVERHEAD = SECRET_HEADER_SIZE + crypto_aead_xchacha20poly1305_ietf_ABYTES;

        // crypto_kdf takes exactly 8 bytes of context; changing it or the id changes every secret's key
        constexpr char SECRET_KDF_CONTEXT[crypto_kdf_CONTEXTBYTES + 1] = "GrdSecrt";
        constexpr uint64_t SECRET_KDF_SUBKEY_ID = 1;

        static_assert(crypto_box_SECRETKEYBYTES == crypto_kdf_KEYBYTES, "the private key is the kdf's master key");
        static_assert(crypto_aead_xchacha20poly1305_ietf_KEYBYTES >= crypto_kdf_BYTES_MIN
            && crypto_aead_xchacha20poly1305_ietf_KEYBYTES <= crypto_kdf_BYTES_MAX, "kdf can produce the aead key");
    } // namespace

    KeyResult X25519Keys::set(const uint8_t publicKey[PUBLIC_KEY_SIZE], const uint8_t* privateKey)
    {
        return Keys::set(publicKey, privateKey, crypto_scalarmult_base);
    }

    KeyResult X25519Keys::generate(const uint8_t* seed)
    {
        return Keys::generate(seed, crypto_box_keypair, crypto_box_seed_keypair);
    }

    size_t X25519Keys::overhead(uint8_t format)
    {
        return format == FORMAT_BOX ? BOX_OVERHEAD : SECRET_OVERHEAD;
    }

    DecryptResult X25519Keys::checkCiphertext(const uint8_t* box, size_t boxSize, uint8_t format)
    {
        if (boxSize < overhead(format)) {
            return DecryptResult::MALFORMED_CIPHERTEXT;
        }
        if (box[0] != format) {
            return DecryptResult::UNKNOWN_VERSION;
        }
        return DecryptResult::SUCCESS;
    }

    bool X25519Keys::encrypt(uint8_t* box, const uint8_t* payload, size_t payloadSize, const uint8_t peerPublicKey[PUBLIC_KEY_SIZE]) const
    {
        uint8_t* nonce = box + 1;
        box[0] = FORMAT_BOX;
        randombytes_buf(nonce, crypto_box_NONCEBYTES);
        return crypto_box_easy(box + BOX_HEADER_SIZE, payload, payloadSize, nonce, peerPublicKey, mPrivateKey) == 0;
    }

    DecryptResult X25519Keys::decrypt(uint8_t* payload, const uint8_t* box, size_t boxSize, const uint8_t peerPublicKey[PUBLIC_KEY_SIZE]) const
    {
        const uint8_t* nonce = box + 1;
        if (crypto_box_open_easy(payload, box + BOX_HEADER_SIZE, boxSize - BOX_HEADER_SIZE, nonce, peerPublicKey, mPrivateKey) != 0) {
            return DecryptResult::DECRYPT_FAILED;
        }
        return DecryptResult::SUCCESS;
    }

    void X25519Keys::encryptSecret(uint8_t* box, const uint8_t* payload, size_t payloadSize) const
    {
        uint8_t* nonce = box + 1;
        box[0] = FORMAT_SECRET;
        randombytes_buf(nonce, crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

        uint8_t key[crypto_aead_xchacha20poly1305_ietf_KEYBYTES];
        deriveSecretKey(key);
        crypto_aead_xchacha20poly1305_ietf_encrypt(
            box + SECRET_HEADER_SIZE, nullptr,
            payload, payloadSize,
            nullptr, 0,
            nullptr, nonce, key
        );
        sodium_memzero(key, sizeof(key));
    }

    DecryptResult X25519Keys::decryptSecret(uint8_t* payload, const uint8_t* box, size_t boxSize) const
    {
        const uint8_t* nonce = box + 1;
        uint8_t key[crypto_aead_xchacha20poly1305_ietf_KEYBYTES];
        deriveSecretKey(key);
        int result = crypto_aead_xchacha20poly1305_ietf_decrypt(
            payload, nullptr,
            nullptr,
            box + SECRET_HEADER_SIZE, boxSize - SECRET_HEADER_SIZE,
            nullptr, 0,
            nonce, key
        );
        sodium_memzero(key, sizeof(key));
        return result == 0 ? DecryptResult::SUCCESS : DecryptResult::DECRYPT_FAILED;
    }

    void X25519Keys::deriveSecretKey(uint8_t* key) const
    {
        crypto_kdf_derive_from_key(key, crypto_aead_xchacha20poly1305_ietf_KEYBYTES, SECRET_KDF_SUBKEY_ID, SECRET_KDF_CONTEXT, mPrivateKey);
    }

} // namespace gradido::crypto
