#pragma once

#include "crypto/Ed25519Keys.h"
#include "crypto/X25519Keys.h"

#include <napi.h>

namespace gradido {

    /**
     * The two key pairs of the home community, kept on the native side as plain members: the
     * Ed25519 one it signs with and the X25519 one it encrypts with, both with private key.
     * sign, verify, encrypt and decrypt are one call from JavaScript and read the keys straight
     * from here; the private keys never cross to JavaScript, there is no export for them.
     *
     * The TypeScript HomeCommunity (shared) holds the one instance and forwards to it. The
     * methods are those of Ed25519KeyPair and X25519KeyPair, with the same arguments, results
     * and errors; see index.d.ts.
     */
    class HomeCommunityNative : public Napi::ObjectWrap<HomeCommunityNative> {
    public:
        static constexpr const char* NAME = "HomeCommunityNative";

        static Napi::Object Init(Napi::Env env, Napi::Object exports);

        // (publicKey, privateKey, publicEncryptionKey, privateEncryptionKey), 32 bytes each;
        // privateKey is the Ed25519 seed
        HomeCommunityNative(const Napi::CallbackInfo& info);

    private:
        Napi::Value Sign(const Napi::CallbackInfo& info);
        Napi::Value Verify(const Napi::CallbackInfo& info);
        Napi::Value Encrypt(const Napi::CallbackInfo& info);
        Napi::Value Decrypt(const Napi::CallbackInfo& info);
        Napi::Value EncryptSecret(const Napi::CallbackInfo& info);
        Napi::Value DecryptSecret(const Napi::CallbackInfo& info);

        crypto::Ed25519Keys mSignKeys;
        crypto::X25519Keys mEncryptionKeys;
    };

} // namespace gradido
