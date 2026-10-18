#pragma once

#include "KeyPair.h"

#include <napi.h>

#include <sodium.h>

namespace gradido::crypto {

    /**
     * An X25519 key pair whose bytes stay on the native side, for authenticated encryption.
     *
     * encrypt/decrypt are libsodium's crypto_box between this pair (with private key) and a
     * peer that carries only its public key -- a peer with a private key is refused, so the two
     * cannot be swapped by mistake. encryptSecret/decryptSecret are for this pair alone: a key
     * derived from the private key with crypto_kdf, XChaCha20-Poly1305 over the payload.
     *
     * Every ciphertext starts with a format byte (FORMAT_BOX or FORMAT_SECRET), then the 24
     * bytes nonce, then ciphertext and 16 bytes MAC. See index.d.ts for the API.
     */
    class X25519KeyPair : public Napi::ObjectWrap<X25519KeyPair>, public KeyPair {
    public:
        static constexpr const char* NAME = "X25519KeyPair";
        static constexpr uint8_t FORMAT_BOX = 1;
        static constexpr uint8_t FORMAT_SECRET = 2;

        static Napi::Object Init(Napi::Env env, Napi::Object exports);
        // (seed?: 32 bytes) -> X25519KeyPair; random without a seed
        static Napi::Value Generate(const Napi::CallbackInfo& info);

        // (publicKey) | (publicKey, privateKey), 32 bytes each
        X25519KeyPair(const Napi::CallbackInfo& info);

    private:
        // (payload, recipient) -> Buffer
        Napi::Value Encrypt(const Napi::CallbackInfo& info);
        // (box, sender) -> Result<Buffer, DecryptError>
        Napi::Value Decrypt(const Napi::CallbackInfo& info);
        // (payload) -> Buffer
        Napi::Value EncryptSecret(const Napi::CallbackInfo& info);
        // (box) -> Result<Buffer, DecryptError>
        Napi::Value DecryptSecret(const Napi::CallbackInfo& info);

        // info[index] as an X25519KeyPair with only a public key; throws a TypeError and returns null otherwise
        static X25519KeyPair* UnwrapPublicOnlyPeer(const Napi::CallbackInfo& info, size_t index, const char* method, const char* name);
        // the key encryptSecret/decryptSecret use, derived from the private key
        void DeriveSecretKey(uint8_t key[crypto_aead_xchacha20poly1305_ietf_KEYBYTES]) const;
    };

} // namespace gradido::crypto
