#pragma once

#include "KeyPair.h"

#include "crypto/Ed25519Keys.h"

#include <napi.h>

namespace gradido::crypto {

    /**
     * An Ed25519 key pair whose bytes stay on the native side: sign and verify read them from
     * here, nothing crosses to JavaScript unless an export is asked for (and then as a copy).
     * Without a private key it can only verify. Plain libsodium keys, not SLIP-10: for the
     * derivation tree see the signKeyPair* functions in crypto.h. See index.d.ts for the API.
     *
     * The keys are an Ed25519Keys (src/crypto), this class reads the arguments and throws.
     */
    class Ed25519KeyPair : public Napi::ObjectWrap<Ed25519KeyPair>, public KeyPair {
    public:
        static constexpr const char* NAME = "Ed25519KeyPair";

        static Napi::Object Init(Napi::Env env, Napi::Object exports);
        // (seed?: 32 bytes) -> Ed25519KeyPair; random without a seed
        static Napi::Value Generate(const Napi::CallbackInfo& info);

        // (publicKey) | (publicKey, privateKey), 32 bytes each; privateKey is the seed
        Ed25519KeyPair(const Napi::CallbackInfo& info);

        // sign and verify on `keys`, for every class that holds Ed25519Keys; `where` names the
        // method in the errors. SignWith needs keys with private key.
        // (message) -> 64 bytes detached signature
        static Napi::Value SignWith(const Napi::CallbackInfo& info, const Ed25519Keys& keys, const char* where);
        // (message, signature: 64 bytes) -> boolean; throws for a signature of another size
        static Napi::Value VerifyWith(const Napi::CallbackInfo& info, const Ed25519Keys& keys, const char* where);

    protected:
        const Keys& keys() const override { return mKeys; }
        KeyResult SetKeys(const uint8_t* publicKey, const uint8_t* privateKey) override { return mKeys.set(publicKey, privateKey); }
        KeyResult GenerateKeys(const uint8_t* seed) override { return mKeys.generate(seed); }

    private:
        // throws without private key
        Napi::Value Sign(const Napi::CallbackInfo& info);
        Napi::Value Verify(const Napi::CallbackInfo& info);
        // (other: Ed25519KeyPair) -> boolean; the same public key, with or without private key
        Napi::Value Equals(const Napi::CallbackInfo& info);

        Ed25519Keys mKeys;
    };

} // namespace gradido::crypto
