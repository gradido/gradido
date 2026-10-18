#include "HomeCommunityNative.h"
#include "Ed25519KeyPair.h"
#include "KeyPair.h"
#include "X25519KeyPair.h"
#include "napiUtils.h"

namespace gradido {

    using crypto::Ed25519KeyPair;
    using crypto::Keys;
    using crypto::X25519KeyPair;

    Napi::Object HomeCommunityNative::Init(Napi::Env env, Napi::Object exports)
    {
        Napi::Function func = DefineClass(env, NAME, {
            InstanceMethod("sign", &HomeCommunityNative::Sign),
            InstanceMethod("verify", &HomeCommunityNative::Verify),
            InstanceMethod("encrypt", &HomeCommunityNative::Encrypt),
            InstanceMethod("decrypt", &HomeCommunityNative::Decrypt),
            InstanceMethod("encryptSecret", &HomeCommunityNative::EncryptSecret),
            InstanceMethod("decryptSecret", &HomeCommunityNative::DecryptSecret),
        });
        exports.Set(NAME, func);
        return exports;
    }

    HomeCommunityNative::HomeCommunityNative(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<HomeCommunityNative>(info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 4) {
            Napi::TypeError::New(env, "[HomeCommunityNative] Expected four arguments: publicKey, privateKey, publicEncryptionKey, privateEncryptionKey")
                .ThrowAsJavaScriptException();
            return;
        }
        Napi::Buffer<uint8_t> publicKey;
        Napi::Buffer<uint8_t> privateKey;
        Napi::Buffer<uint8_t> publicEncryptionKey;
        Napi::Buffer<uint8_t> privateEncryptionKey;
        if (!readBytes(env, info[0], NAME, "publicKey", Keys::PUBLIC_KEY_SIZE, publicKey)
            || !readBytes(env, info[1], NAME, "privateKey", Keys::PRIVATE_KEY_SIZE, privateKey)
            || !readBytes(env, info[2], NAME, "publicEncryptionKey", Keys::PUBLIC_KEY_SIZE, publicEncryptionKey)
            || !readBytes(env, info[3], NAME, "privateEncryptionKey", Keys::PRIVATE_KEY_SIZE, privateEncryptionKey)) {
            return;
        }
        if (!crypto::KeyPair::CheckKeyResult(env, mSignKeys.set(publicKey.Data(), privateKey.Data()), NAME, "privateKey", "publicKey")) {
            return;
        }
        crypto::KeyPair::CheckKeyResult(
            env, mEncryptionKeys.set(publicEncryptionKey.Data(), privateEncryptionKey.Data()),
            NAME, "privateEncryptionKey", "publicEncryptionKey"
        );
    }

    Napi::Value HomeCommunityNative::Sign(const Napi::CallbackInfo& info)
    {
        return Ed25519KeyPair::SignWith(info, mSignKeys, "HomeCommunityNative.sign");
    }

    Napi::Value HomeCommunityNative::Verify(const Napi::CallbackInfo& info)
    {
        return Ed25519KeyPair::VerifyWith(info, mSignKeys, "HomeCommunityNative.verify");
    }

    Napi::Value HomeCommunityNative::Encrypt(const Napi::CallbackInfo& info)
    {
        return X25519KeyPair::EncryptWith(info, mEncryptionKeys, "HomeCommunityNative.encrypt");
    }

    Napi::Value HomeCommunityNative::Decrypt(const Napi::CallbackInfo& info)
    {
        return X25519KeyPair::DecryptWith(info, mEncryptionKeys, "HomeCommunityNative.decrypt");
    }

    Napi::Value HomeCommunityNative::EncryptSecret(const Napi::CallbackInfo& info)
    {
        return X25519KeyPair::EncryptSecretWith(info, mEncryptionKeys, "HomeCommunityNative.encryptSecret");
    }

    Napi::Value HomeCommunityNative::DecryptSecret(const Napi::CallbackInfo& info)
    {
        return X25519KeyPair::DecryptSecretWith(info, mEncryptionKeys, "HomeCommunityNative.decryptSecret");
    }

} // namespace gradido
