#include "HomeCommunityNative.h"
#include "Ed25519KeyPair.h"
#include "KeyPair.h"
#include "X25519KeyPair.h"
#include "napiUtils.h"

#include "arnm/converter.h"

#include <sodium.h>

#include <string>

namespace gradido {

    using crypto::Ed25519KeyPair;
    using crypto::Keys;
    using crypto::X25519KeyPair;

    namespace {
        // a hash is public, arnm's base64 not being constant time carries nothing here
        Napi::Value sha256Base64(Napi::Env env, const std::string& data)
        {
            uint8_t hash[crypto_hash_sha256_BYTES];
            crypto_hash_sha256(hash, reinterpret_cast<const uint8_t*>(data.data()), data.size());
            char base64[ARNM_BASE64_STRING_LENGTH(sizeof(hash)) + 1];
            arnm_result result = arnm_binary_to_base64(base64, hash, sizeof(hash));
            if (result != ARNM_SUCCESS) {
                Napi::Error::New(env, std::string("[HomeCommunityNative] arnm_binary_to_base64 failed: ") + arnm_result_to_string(result)).ThrowAsJavaScriptException();
                return env.Null();
            }
            return Napi::String::New(env, base64);
        }
    } // namespace

    Napi::Object HomeCommunityNative::Init(Napi::Env env, Napi::Object exports)
    {
        Napi::Function func = DefineClass(env, NAME, {
            InstanceMethod("sign", &HomeCommunityNative::Sign),
            InstanceMethod("verify", &HomeCommunityNative::Verify),
            InstanceMethod("encrypt", &HomeCommunityNative::Encrypt),
            InstanceMethod("decrypt", &HomeCommunityNative::Decrypt),
            InstanceMethod("encryptSecret", &HomeCommunityNative::EncryptSecret),
            InstanceMethod("decryptSecret", &HomeCommunityNative::DecryptSecret),
            InstanceMethod("sha256", &HomeCommunityNative::Sha256),
            InstanceMethod("encryptAndHash", &HomeCommunityNative::EncryptAndHash),
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

    Napi::Value HomeCommunityNative::Sha256(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsString()) {
            Napi::TypeError::New(env, "[HomeCommunityNative.sha256] Expected data to be a string").ThrowAsJavaScriptException();
            return env.Null();
        }
        return sha256Base64(env, info[0].As<Napi::String>().Utf8Value());
    }

    Napi::Value HomeCommunityNative::EncryptAndHash(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::Value box = X25519KeyPair::EncryptWith(info, mEncryptionKeys, "HomeCommunityNative.encryptAndHash");
        if (env.IsExceptionPending()) {
            return env.Null();
        }
        Napi::Object result = Napi::Object::New(env);
        result.Set("box", box);
        result.Set("hash", sha256Base64(env, box.As<Napi::String>().Utf8Value()));
        return result;
    }

} // namespace gradido
