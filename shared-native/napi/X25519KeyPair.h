#pragma once

#include "KeyPair.h"

#include "crypto/X25519Keys.h"

#include <napi.h>

namespace gradido::crypto {

    /**
     * An X25519 key pair whose bytes stay on the native side, for authenticated encryption.
     *
     * encrypt/decrypt are libsodium's crypto_box between this pair (with private key) and a
     * peer that carries only its public key -- a peer with a private key is refused, so the two
     * cannot be swapped by mistake. encryptSecret/decryptSecret are for this pair alone: a key
     * derived from the private key with crypto_kdf, XChaCha20-Poly1305 over the payload.
     *
     * The keys and the ciphertext format are X25519Keys (src/crypto), this class reads the
     * arguments, throws and builds the results. See index.d.ts for the API.
     */
    class X25519KeyPair : public Napi::ObjectWrap<X25519KeyPair>, public KeyPair {
    public:
        static constexpr const char* NAME = "X25519KeyPair";

        static Napi::Object Init(Napi::Env env, Napi::Object exports);
        // (seed?: 32 bytes) -> X25519KeyPair; random without a seed
        static Napi::Value Generate(const Napi::CallbackInfo& info);

        // (publicKey) | (publicKey, privateKey), 32 bytes each
        X25519KeyPair(const Napi::CallbackInfo& info);

        // encrypt and decrypt on `keys`, for every class that holds X25519Keys; `where` names the
        // method in the errors. All need keys with private key.
        // (payload, recipient: X25519KeyPair with public key only) -> Buffer
        static Napi::Value EncryptWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where);
        // (box, sender: X25519KeyPair with public key only) -> Result<Buffer, DecryptError>
        static Napi::Value DecryptWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where);
        // (payload) -> Buffer
        static Napi::Value EncryptSecretWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where);
        // (box) -> Result<Buffer, DecryptError>
        static Napi::Value DecryptSecretWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where);

    protected:
        const Keys& keys() const override { return mKeys; }
        KeyResult SetKeys(const uint8_t* publicKey, const uint8_t* privateKey) override { return mKeys.set(publicKey, privateKey); }
        KeyResult GenerateKeys(const uint8_t* seed) override { return mKeys.generate(seed); }

    private:
        // throw without private key
        Napi::Value Encrypt(const Napi::CallbackInfo& info);
        Napi::Value Decrypt(const Napi::CallbackInfo& info);
        Napi::Value EncryptSecret(const Napi::CallbackInfo& info);
        Napi::Value DecryptSecret(const Napi::CallbackInfo& info);

        // the keys of info[index], an X25519KeyPair with only a public key; throws a TypeError and returns null otherwise
        static const X25519Keys* UnwrapPublicOnlyPeer(const Napi::CallbackInfo& info, size_t index, const char* where, const char* name);

        X25519Keys mKeys;
    };

} // namespace gradido::crypto
