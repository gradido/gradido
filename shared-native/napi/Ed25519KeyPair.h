#pragma once

#include "KeyPair.h"

#include <napi.h>

#include <sodium.h>

namespace gradido::crypto {

    /**
     * An Ed25519 key pair whose bytes stay on the native side: sign and verify read them from
     * here, nothing crosses to JavaScript unless an export is asked for (and then as a copy).
     * Without a private key it can only verify. Plain libsodium keys, not SLIP-10: for the
     * derivation tree see the signKeyPair* functions in crypto.h. See index.d.ts for the API.
     *
     * The private key is the 32 bytes seed only; libsodium's 64 bytes form (seed and public key)
 * is put together on the stack for sign, so the public key is not kept twice.
     */
    class Ed25519KeyPair : public Napi::ObjectWrap<Ed25519KeyPair>, public KeyPair {
    public:
        static constexpr const char* NAME = "Ed25519KeyPair";

        static Napi::Object Init(Napi::Env env, Napi::Object exports);
        // (seed?: 32 bytes) -> Ed25519KeyPair; random without a seed
        static Napi::Value Generate(const Napi::CallbackInfo& info);

        // (publicKey) | (publicKey, privateKey), 32 bytes each; privateKey is the seed
        Ed25519KeyPair(const Napi::CallbackInfo& info);

    private:
        // (message) -> 64 bytes detached signature; throws without private key
        Napi::Value Sign(const Napi::CallbackInfo& info);
        // (message, signature: 64 bytes) -> boolean; throws for a signature of another size
        Napi::Value Verify(const Napi::CallbackInfo& info);
    };

} // namespace gradido::crypto
