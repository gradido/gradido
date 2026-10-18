#include "KeyPair.h"

#include "arnm/converter.h"

#include <cstring>

namespace gradido::crypto {

    namespace {
        // the largest key a subclass has; both private keys are 32 bytes
        constexpr size_t MAX_PRIVATE_KEY_SIZE = 32;
        static_assert(KeyPair::PUBLIC_KEY_SIZE <= MAX_PRIVATE_KEY_SIZE, "Hex has room for the public key");
    }

    char KeyPair::GENERATE_TOKEN = 0;

    KeyPair::KeyPair(const char* name, size_t privateKeySize)
        : mName(name), mPrivateKeySize(privateKeySize), mPublicKey{}, mPrivateKey(nullptr)
    {
    }

    KeyPair::~KeyPair()
    {
        FreePrivateKey();
    }

    void KeyPair::InitKeys(const Napi::CallbackInfo& info, PublicKeyFunction publicKeyOf)
    {
        Napi::Env env = info.Env();
        if (info.Length() == 1 && info[0].IsExternal() && info[0].As<Napi::External<char>>().Data() == &GENERATE_TOKEN) {
            return;
        }
        if (info.Length() < 1 || info.Length() > 2) {
            Napi::TypeError::New(env, std::string("[") + mName + "] Expected one or two arguments: publicKey and optional privateKey")
                .ThrowAsJavaScriptException();
            return;
        }
        Napi::Buffer<uint8_t> publicKey;
        if (!readBytes(env, info[0], mName, "publicKey", PUBLIC_KEY_SIZE, publicKey)) {
            return;
        }
        memcpy(mPublicKey, publicKey.Data(), PUBLIC_KEY_SIZE);
        if (info.Length() < 2 || info[1].IsUndefined()) {
            return;
        }
        Napi::Buffer<uint8_t> privateKey;
        if (!readBytes(env, info[1], mName, "privateKey", mPrivateKeySize, privateKey)) {
            return;
        }
        uint8_t derivedPublicKey[PUBLIC_KEY_SIZE];
        if (publicKeyOf(derivedPublicKey, privateKey.Data()) != 0
            || sodium_memcmp(derivedPublicKey, mPublicKey, PUBLIC_KEY_SIZE) != 0) {
            Napi::TypeError::New(env, std::string("[") + mName + "] privateKey does not belong to publicKey").ThrowAsJavaScriptException();
            return;
        }
        if (!AllocatePrivateKey(env)) {
            return;
        }
        memcpy(mPrivateKey, privateKey.Data(), mPrivateKeySize);
    }

    bool KeyPair::AllocatePrivateKey(Napi::Env env)
    {
        mPrivateKey = static_cast<uint8_t*>(sodium_malloc(mPrivateKeySize));
        if (mPrivateKey == nullptr) {
            Napi::Error::New(env, std::string("[") + mName + "] Out of memory for the private key").ThrowAsJavaScriptException();
            return false;
        }
        return true;
    }

    void KeyPair::FreePrivateKey()
    {
        // zeroes the memory before freeing it, and takes null
        sodium_free(mPrivateKey);
        mPrivateKey = nullptr;
    }

    bool KeyPair::RequirePrivateKey(const Napi::CallbackInfo& info, const char* method) const
    {
        if (mPrivateKey == nullptr) {
            Napi::TypeError::New(info.Env(), std::string("[") + mName + "." + method + "] Needs a private key, this key pair has only a public key")
                .ThrowAsJavaScriptException();
            return false;
        }
        return true;
    }

    Napi::Value KeyPair::Hex(Napi::Env env, const uint8_t* data, size_t size) const
    {
        char hex[ARNM_HEX_STRING_LENGTH(MAX_PRIVATE_KEY_SIZE)];
        arnm_result result = arnm_binary_to_hex(hex, data, static_cast<uint32_t>(size));
        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[") + mName + "] arnm_binary_to_hex failed: " + arnm_result_to_string(result)).ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::String string = Napi::String::New(env, hex, size * 2);
        // it may have held the private key
        sodium_memzero(hex, sizeof(hex));
        return string;
    }

    Napi::Value KeyPair::HasPrivateKey(const Napi::CallbackInfo& info)
    {
        return Napi::Boolean::New(info.Env(), hasPrivateKey());
    }

    Napi::Value KeyPair::ToBuffer(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::Object keys = Napi::Object::New(env);
        keys.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, mPublicKey, PUBLIC_KEY_SIZE));
        keys.Set("privateKey", hasPrivateKey() ? Napi::Value(Napi::Buffer<uint8_t>::Copy(env, mPrivateKey, mPrivateKeySize)) : env.Null());
        return keys;
    }

    Napi::Value KeyPair::ToHex(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::Object keys = Napi::Object::New(env);
        keys.Set("publicKey", Hex(env, mPublicKey, PUBLIC_KEY_SIZE));
        keys.Set("privateKey", hasPrivateKey() ? Hex(env, mPrivateKey, mPrivateKeySize) : env.Null());
        return keys;
    }

    Napi::Value KeyPair::PublicKeyToBuffer(const Napi::CallbackInfo& info)
    {
        return Napi::Buffer<uint8_t>::Copy(info.Env(), mPublicKey, PUBLIC_KEY_SIZE);
    }

    Napi::Value KeyPair::PublicKeyToHex(const Napi::CallbackInfo& info)
    {
        return Hex(info.Env(), mPublicKey, PUBLIC_KEY_SIZE);
    }

    Napi::Value KeyPair::PrivateKeyToBuffer(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "privateKeyToBuffer")) {
            return info.Env().Null();
        }
        return Napi::Buffer<uint8_t>::Copy(info.Env(), mPrivateKey, mPrivateKeySize);
    }

    Napi::Value KeyPair::PrivateKeyToHex(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "privateKeyToHex")) {
            return info.Env().Null();
        }
        return Hex(info.Env(), mPrivateKey, mPrivateKeySize);
    }

} // namespace gradido::crypto
