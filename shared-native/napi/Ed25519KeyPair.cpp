#include "Ed25519KeyPair.h"
#include "AddonData.h"
#include "napiUtils.h"

#include <cstring>

namespace gradido::crypto {

    static_assert(crypto_sign_PUBLICKEYBYTES == KeyPair::PUBLIC_KEY_SIZE, "Ed25519 public key fits KeyPair");

    namespace {
        // the public key of a seed; libsodium's 64 bytes secret key, which comes along, is dropped
        int derivePublicKey(uint8_t* publicKey, const uint8_t* seed)
        {
            uint8_t secretKey[crypto_sign_SECRETKEYBYTES];
            crypto_sign_seed_keypair(publicKey, secretKey, seed);
            sodium_memzero(secretKey, sizeof(secretKey));
            // every seed has a public key
            return 0;
        }

        // for KeyPair::Generate, which writes privateKey straight into the instance: only the seed is kept
        int randomKeyPair(uint8_t* publicKey, uint8_t* privateKey)
        {
            randombytes_buf(privateKey, crypto_sign_SEEDBYTES);
            derivePublicKey(publicKey, privateKey);
            return 0;
        }

        int seedKeyPair(uint8_t* publicKey, uint8_t* privateKey, const uint8_t* seed)
        {
            memcpy(privateKey, seed, crypto_sign_SEEDBYTES);
            derivePublicKey(publicKey, privateKey);
            return 0;
        }
    }

    Napi::Object Ed25519KeyPair::Init(Napi::Env env, Napi::Object exports)
    {
        auto properties = KeyPair::InstanceMethods<Ed25519KeyPair>();
        properties.push_back(StaticMethod("generate", &Ed25519KeyPair::Generate));
        properties.push_back(InstanceMethod("sign", &Ed25519KeyPair::Sign));
        properties.push_back(InstanceMethod("verify", &Ed25519KeyPair::Verify));
        Napi::Function func = DefineClass(env, NAME, properties);
        env.GetInstanceData<AddonData>()->ed25519KeyPair = Napi::Persistent(func);
        exports.Set(NAME, func);
        return exports;
    }

    Napi::Value Ed25519KeyPair::Generate(const Napi::CallbackInfo& info)
    {
        return KeyPair::Generate<Ed25519KeyPair>(
            info, info.Env().GetInstanceData<AddonData>()->ed25519KeyPair,
            crypto_sign_SEEDBYTES, randomKeyPair, seedKeyPair
        );
    }

    Ed25519KeyPair::Ed25519KeyPair(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<Ed25519KeyPair>(info), KeyPair(NAME, crypto_sign_SEEDBYTES)
    {
        InitKeys(info, derivePublicKey);
    }

    Napi::Value Ed25519KeyPair::Sign(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!RequirePrivateKey(info, "sign")) {
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[Ed25519KeyPair.sign] Expected message to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> message = info[0].As<Napi::Buffer<uint8_t>>();
        // libsodium's secret key is seed and public key; put together only for the call
        uint8_t secretKey[crypto_sign_SECRETKEYBYTES];
        memcpy(secretKey, mPrivateKey, crypto_sign_SEEDBYTES);
        memcpy(secretKey + crypto_sign_SEEDBYTES, mPublicKey, PUBLIC_KEY_SIZE);
        auto signature = Napi::Buffer<uint8_t>::New(env, crypto_sign_BYTES);
        crypto_sign_detached(signature.Data(), nullptr, message.Data(), message.Length(), secretKey);
        sodium_memzero(secretKey, sizeof(secretKey));
        return signature;
    }

    Napi::Value Ed25519KeyPair::Verify(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[Ed25519KeyPair.verify] Expected message to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> message = info[0].As<Napi::Buffer<uint8_t>>();
        // a signature of the wrong size is the caller's bug: it has to be checked where it comes in
        Napi::Buffer<uint8_t> signature;
        if (!readBytes(env, info[1], "Ed25519KeyPair.verify", "signature", crypto_sign_BYTES, signature)) {
            return env.Null();
        }
        int result = crypto_sign_verify_detached(signature.Data(), message.Data(), message.Length(), mPublicKey);
        return Napi::Boolean::New(env, result == 0);
    }

} // namespace gradido::crypto
