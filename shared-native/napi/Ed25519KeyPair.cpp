#include "Ed25519KeyPair.h"
#include "AddonData.h"
#include "napiUtils.h"

#include <string>

namespace gradido::crypto {

    Napi::Object Ed25519KeyPair::Init(Napi::Env env, Napi::Object exports)
    {
        auto properties = KeyPair::InstanceMethods<Ed25519KeyPair>();
        properties.push_back(StaticMethod("generate", &Ed25519KeyPair::Generate));
        properties.push_back(InstanceMethod("sign", &Ed25519KeyPair::Sign));
        properties.push_back(InstanceMethod("verify", &Ed25519KeyPair::Verify));
        properties.push_back(InstanceMethod("equals", &Ed25519KeyPair::Equals));
        Napi::Function func = DefineClass(env, NAME, properties);
        env.GetInstanceData<AddonData>()->ed25519KeyPair = Napi::Persistent(func);
        exports.Set(NAME, func);
        return exports;
    }

    Napi::Value Ed25519KeyPair::Generate(const Napi::CallbackInfo& info)
    {
        return KeyPair::Generate<Ed25519KeyPair>(info, info.Env().GetInstanceData<AddonData>()->ed25519KeyPair, Ed25519Keys::SEED_SIZE);
    }

    Ed25519KeyPair::Ed25519KeyPair(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<Ed25519KeyPair>(info), KeyPair(NAME)
    {
        InitKeys(info);
    }

    Napi::Value Ed25519KeyPair::SignWith(const Napi::CallbackInfo& info, const Ed25519Keys& keys, const char* where)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, std::string("[") + where + "] Expected message to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> message = info[0].As<Napi::Buffer<uint8_t>>();
        auto signature = Napi::Buffer<uint8_t>::New(env, Ed25519Keys::SIGNATURE_SIZE);
        keys.sign(signature.Data(), message.Data(), message.Length());
        return signature;
    }

    Napi::Value Ed25519KeyPair::VerifyWith(const Napi::CallbackInfo& info, const Ed25519Keys& keys, const char* where)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, std::string("[") + where + "] Expected message to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> message = info[0].As<Napi::Buffer<uint8_t>>();
        // a signature of the wrong size is the caller's bug: it has to be checked where it comes in
        Napi::Buffer<uint8_t> signature;
        if (!readBytes(env, info[1], where, "signature", Ed25519Keys::SIGNATURE_SIZE, signature)) {
            return env.Null();
        }
        return Napi::Boolean::New(env, keys.verify(signature.Data(), message.Data(), message.Length()));
    }

    Napi::Value Ed25519KeyPair::Sign(const Napi::CallbackInfo& info)
    {
        if (!RequirePrivateKey(info, "sign")) {
            return info.Env().Null();
        }
        return SignWith(info, mKeys, "Ed25519KeyPair.sign");
    }

    Napi::Value Ed25519KeyPair::Verify(const Napi::CallbackInfo& info)
    {
        return VerifyWith(info, mKeys, "Ed25519KeyPair.verify");
    }

    Napi::Value Ed25519KeyPair::Equals(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        Napi::FunctionReference& constructor = env.GetInstanceData<AddonData>()->ed25519KeyPair;
        if (info.Length() != 1 || !info[0].IsObject() || !info[0].As<Napi::Object>().InstanceOf(constructor.Value())) {
            Napi::TypeError::New(env, "[Ed25519KeyPair.equals] Expected other to be an Ed25519KeyPair").ThrowAsJavaScriptException();
            return env.Null();
        }
        const Ed25519KeyPair* other = Ed25519KeyPair::Unwrap(info[0].As<Napi::Object>());
        return Napi::Boolean::New(env, mKeys.samePublicKey(other->mKeys));
    }

} // namespace gradido::crypto
