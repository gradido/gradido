#include "HomeCommunityNative.h"
#include "Ed25519KeyPair.h"
#include "KeyPair.h"
#include "X25519KeyPair.h"
#include "crypto.h"
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
            InstanceMethod("encryptAndHash", &HomeCommunityNative::EncryptAndHash),
            InstanceMethod("decryptAndHash", &HomeCommunityNative::DecryptAndHash),
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

    Napi::Value HomeCommunityNative::EncryptAndHash(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::Value box = X25519KeyPair::EncryptWith(info, mEncryptionKeys, "HomeCommunityNative.encryptAndHash");
        if (env.IsExceptionPending()) {
            return env.Null();
        }
        Napi::Object result = Napi::Object::New(env);
        Napi::Buffer<uint8_t> boxBytes = box.As<Napi::Buffer<uint8_t>>();
        Napi::Value hash = crypto::HashGenericBase64(env, boxBytes.Data(), boxBytes.Length());
        if (env.IsExceptionPending()) {
            return env.Null();
        }
        result.Set("box", box);
        result.Set("hash", hash);
        return result;
    }

    Napi::Value HomeCommunityNative::DecryptAndHash(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::Value decrypted = X25519KeyPair::DecryptWith(info, mEncryptionKeys, "HomeCommunityNative.decryptAndHash");
        if (env.IsExceptionPending()) {
            return env.Null();
        }
        Napi::Object result = decrypted.As<Napi::Object>();
        if (!result.Get("success").ToBoolean().Value()) {
            return result;
        }
        Napi::Buffer<uint8_t> boxBytes = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Value hash = crypto::HashGenericBase64(env, boxBytes.Data(), boxBytes.Length());
        if (env.IsExceptionPending()) {
            return env.Null();
        }
        Napi::Object value = Napi::Object::New(env);
        value.Set("payload", result.Get("value"));
        value.Set("hash", hash);
        result.Set("value", value);
        return result;
    }

} // namespace gradido
