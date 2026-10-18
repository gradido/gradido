#include "KeyPair.h"

#include "arnm/converter.h"

#include <sodium.h>

namespace gradido::crypto {

    static_assert(Keys::PUBLIC_KEY_SIZE <= Keys::PRIVATE_KEY_SIZE, "Hex has room for the public key");

    char KeyPair::GENERATE_TOKEN = 0;

    KeyPair::KeyPair(const char* name)
        : mName(name)
    {
    }

    bool KeyPair::CheckKeyResult(Napi::Env env, KeyResult result, const char* where, const char* privateName, const char* publicName)
    {
        switch (result) {
        case KeyResult::SUCCESS:
            return true;
        case KeyResult::PRIVATE_KEY_MISMATCH:
            Napi::TypeError::New(env, std::string("[") + where + "] " + privateName + " does not belong to " + publicName)
                .ThrowAsJavaScriptException();
            return false;
        case KeyResult::OUT_OF_MEMORY:
            Napi::Error::New(env, std::string("[") + where + "] Out of memory for the " + privateName).ThrowAsJavaScriptException();
            return false;
        }
        // every enumerator is handled above; a new one has to be added there
        Napi::Error::New(env, std::string("[") + where + "] Unhandled KeyResult").ThrowAsJavaScriptException();
        return false;
    }

    void KeyPair::InitKeys(const Napi::CallbackInfo& info)
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
        if (!readBytes(env, info[0], mName, "publicKey", Keys::PUBLIC_KEY_SIZE, publicKey)) {
            return;
        }
        Napi::Buffer<uint8_t> privateKey;
        bool hasPrivateKey = info.Length() == 2 && !info[1].IsUndefined();
        if (hasPrivateKey && !readBytes(env, info[1], mName, "privateKey", Keys::PRIVATE_KEY_SIZE, privateKey)) {
            return;
        }
        CheckKeyResult(env, SetKeys(publicKey.Data(), hasPrivateKey ? privateKey.Data() : nullptr), mName, "privateKey", "publicKey");
    }

    bool KeyPair::RequirePrivateKey(const Napi::CallbackInfo& info, const char* method) const
    {
        if (!hasPrivateKey()) {
            Napi::TypeError::New(info.Env(), std::string("[") + mName + "." + method + "] Needs a private key, this key pair has only a public key")
                .ThrowAsJavaScriptException();
            return false;
        }
        return true;
    }

    Napi::Value KeyPair::Hex(Napi::Env env, const uint8_t* data, size_t size) const
    {
        char hex[ARNM_HEX_STRING_LENGTH(Keys::PRIVATE_KEY_SIZE)];
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
        const Keys& k = keys();
        Napi::Object result = Napi::Object::New(env);
        result.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, k.publicKey(), Keys::PUBLIC_KEY_SIZE));
        result.Set("privateKey", k.hasPrivateKey() ? Napi::Value(Napi::Buffer<uint8_t>::Copy(env, k.privateKey(), Keys::PRIVATE_KEY_SIZE)) : env.Null());
        return result;
    }

    Napi::Value KeyPair::ToHex(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        const Keys& k = keys();
        Napi::Object result = Napi::Object::New(env);
        result.Set("publicKey", Hex(env, k.publicKey(), Keys::PUBLIC_KEY_SIZE));
        result.Set("privateKey", k.hasPrivateKey() ? Hex(env, k.privateKey(), Keys::PRIVATE_KEY_SIZE) : env.Null());
        return result;
    }

    Napi::Value KeyPair::PublicKeyToBuffer(const Napi::CallbackInfo& info)
    {
        return Napi::Buffer<uint8_t>::Copy(info.Env(), keys().publicKey(), Keys::PUBLIC_KEY_SIZE);
    }

    Napi::Value KeyPair::PublicKeyToHex(const Napi::CallbackInfo& info)
    {
        return Hex(info.Env(), keys().publicKey(), Keys::PUBLIC_KEY_SIZE);
    }

    Napi::Value KeyPair::PrivateKeyToBuffer(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "privateKeyToBuffer")) {
            return info.Env().Null();
        }
        return Napi::Buffer<uint8_t>::Copy(info.Env(), keys().privateKey(), Keys::PRIVATE_KEY_SIZE);
    }

    Napi::Value KeyPair::PrivateKeyToHex(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "privateKeyToHex")) {
            return info.Env().Null();
        }
        return Hex(info.Env(), keys().privateKey(), Keys::PRIVATE_KEY_SIZE);
    }

} // namespace gradido::crypto
