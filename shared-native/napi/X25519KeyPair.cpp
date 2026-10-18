// AI-GENERATED — not an architecture reference
#include "X25519KeyPair.h"
#include "AddonData.h"
#include "napiUtils.h"

#include <string>

namespace gradido::crypto {

    namespace {
        // the failure result decrypt hands back for what checkCiphertext refused
        Napi::Value ciphertextFailure(Napi::Env env, DecryptResult result, const Napi::Buffer<uint8_t>& box, uint8_t format)
        {
            switch (result) {
            case DecryptResult::MALFORMED_CIPHERTEXT:
                return failureResult(
                    env, "MalformedCiphertext",
                    "ciphertext is " + std::to_string(box.Length()) + " bytes, at least " + std::to_string(X25519Keys::overhead(format)) + " expected"
                );
            case DecryptResult::UNKNOWN_VERSION:
                return failureResult(
                    env, "UnknownVersion",
                    "ciphertext has format " + std::to_string(box.Data()[0]) + ", expected " + std::to_string(format)
                );
            case DecryptResult::SUCCESS:
            case DecryptResult::DECRYPT_FAILED:
                break;
            }
            // called only for a refusal, and checkCiphertext never answers DECRYPT_FAILED
            Napi::Error::New(env, "[X25519KeyPair] Unhandled DecryptResult").ThrowAsJavaScriptException();
            return env.Null();
        }
    } // namespace

    Napi::Object X25519KeyPair::Init(Napi::Env env, Napi::Object exports)
    {
        auto properties = KeyPair::InstanceMethods<X25519KeyPair>();
        properties.push_back(StaticMethod("generate", &X25519KeyPair::Generate));
        properties.push_back(InstanceMethod("encrypt", &X25519KeyPair::Encrypt));
        properties.push_back(InstanceMethod("decrypt", &X25519KeyPair::Decrypt));
        properties.push_back(InstanceMethod("encryptSecret", &X25519KeyPair::EncryptSecret));
        properties.push_back(InstanceMethod("decryptSecret", &X25519KeyPair::DecryptSecret));
        Napi::Function func = DefineClass(env, NAME, properties);
        env.GetInstanceData<AddonData>()->x25519KeyPair = Napi::Persistent(func);
        exports.Set(NAME, func);
        return exports;
    }

    Napi::Value X25519KeyPair::Generate(const Napi::CallbackInfo& info)
    {
        return KeyPair::Generate<X25519KeyPair>(info, info.Env().GetInstanceData<AddonData>()->x25519KeyPair, X25519Keys::SEED_SIZE);
    }

    X25519KeyPair::X25519KeyPair(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<X25519KeyPair>(info), KeyPair(NAME)
    {
        InitKeys(info);
    }

    const X25519Keys* X25519KeyPair::UnwrapPublicOnlyPeer(const Napi::CallbackInfo& info, size_t index, const char* where, const char* name)
    {
        Napi::Env env = info.Env();
        Napi::FunctionReference& constructor = env.GetInstanceData<AddonData>()->x25519KeyPair;
        if (info.Length() <= index || !info[index].IsObject() || !info[index].As<Napi::Object>().InstanceOf(constructor.Value())) {
            Napi::TypeError::New(env, std::string("[") + where + "] Expected " + name + " to be an X25519KeyPair")
                .ThrowAsJavaScriptException();
            return nullptr;
        }
        X25519KeyPair* peer = X25519KeyPair::Unwrap(info[index].As<Napi::Object>());
        if (peer->hasPrivateKey()) {
            Napi::TypeError::New(
                env,
                std::string("[") + where + "] Expected " + name
                + " to carry only a public key; create it with new X25519KeyPair(publicKey)"
            ).ThrowAsJavaScriptException();
            return nullptr;
        }
        return &peer->mKeys;
    }

    Napi::Value X25519KeyPair::EncryptWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, std::string("[") + where + "] Expected payload to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> payload = info[0].As<Napi::Buffer<uint8_t>>();
        const X25519Keys* recipient = UnwrapPublicOnlyPeer(info, 1, where, "recipient");
        if (recipient == nullptr) {
            return env.Null();
        }
        auto box = Napi::Buffer<uint8_t>::New(env, X25519Keys::overhead(X25519Keys::FORMAT_BOX) + payload.Length());
        if (!keys.encrypt(box.Data(), payload.Data(), payload.Length(), recipient->publicKey())) {
            Napi::Error::New(env, std::string("[") + where + "] recipient's public key is unusable (a point of low order)").ThrowAsJavaScriptException();
            return env.Null();
        }
        return box;
    }

    Napi::Value X25519KeyPair::DecryptWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, std::string("[") + where + "] Expected box to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> box = info[0].As<Napi::Buffer<uint8_t>>();
        const X25519Keys* sender = UnwrapPublicOnlyPeer(info, 1, where, "sender");
        if (sender == nullptr) {
            return env.Null();
        }
        DecryptResult check = X25519Keys::checkCiphertext(box.Data(), box.Length(), X25519Keys::FORMAT_BOX);
        if (check != DecryptResult::SUCCESS) {
            return ciphertextFailure(env, check, box, X25519Keys::FORMAT_BOX);
        }
        auto payload = Napi::Buffer<uint8_t>::New(env, box.Length() - X25519Keys::overhead(X25519Keys::FORMAT_BOX));
        if (keys.decrypt(payload.Data(), box.Data(), box.Length(), sender->publicKey()) != DecryptResult::SUCCESS) {
            return failureResult(env, "DecryptFailed", "ciphertext was altered, or not encrypted by sender for this key pair");
        }
        return successResult(env, payload);
    }

    Napi::Value X25519KeyPair::EncryptSecretWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, std::string("[") + where + "] Expected payload to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> payload = info[0].As<Napi::Buffer<uint8_t>>();
        auto box = Napi::Buffer<uint8_t>::New(env, X25519Keys::overhead(X25519Keys::FORMAT_SECRET) + payload.Length());
        keys.encryptSecret(box.Data(), payload.Data(), payload.Length());
        return box;
    }

    Napi::Value X25519KeyPair::DecryptSecretWith(const Napi::CallbackInfo& info, const X25519Keys& keys, const char* where)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, std::string("[") + where + "] Expected box to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> box = info[0].As<Napi::Buffer<uint8_t>>();
        DecryptResult check = X25519Keys::checkCiphertext(box.Data(), box.Length(), X25519Keys::FORMAT_SECRET);
        if (check != DecryptResult::SUCCESS) {
            return ciphertextFailure(env, check, box, X25519Keys::FORMAT_SECRET);
        }
        auto payload = Napi::Buffer<uint8_t>::New(env, box.Length() - X25519Keys::overhead(X25519Keys::FORMAT_SECRET));
        if (keys.decryptSecret(payload.Data(), box.Data(), box.Length()) != DecryptResult::SUCCESS) {
            return failureResult(env, "DecryptFailed", "ciphertext was altered, or not encrypted by this key pair");
        }
        return successResult(env, payload);
    }

    Napi::Value X25519KeyPair::Encrypt(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "encrypt")) {
            return info.Env().Null();
        }
        return EncryptWith(info, mKeys, "X25519KeyPair.encrypt");
    }

    Napi::Value X25519KeyPair::Decrypt(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "decrypt")) {
            return info.Env().Null();
        }
        return DecryptWith(info, mKeys, "X25519KeyPair.decrypt");
    }

    Napi::Value X25519KeyPair::EncryptSecret(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "encryptSecret")) {
            return info.Env().Null();
        }
        return EncryptSecretWith(info, mKeys, "X25519KeyPair.encryptSecret");
    }

    Napi::Value X25519KeyPair::DecryptSecret(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "decryptSecret")) {
            return info.Env().Null();
        }
        return DecryptSecretWith(info, mKeys, "X25519KeyPair.decryptSecret");
    }

} // namespace gradido::crypto
