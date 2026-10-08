// AI-GENERATED — not an architecture reference
#include "AppContext.h"

#include "arnm/mono_timer.h"

#include <sodium.h>

#include <string>

namespace gradido {

    namespace {
        // A Buffer property of options into bytes. Throws and returns false when it is not one.
        bool readBytes(Napi::Env env, Napi::Object options, const char* name, std::vector<uint8_t>& out)
        {
            if (!options.Has(name) || !options.Get(name).IsBuffer()) {
                Napi::TypeError::New(env, std::string("[NativeAppContext] Expected options.") + name + " to be a Uint8Array").ThrowAsJavaScriptException();
                return false;
            }
            auto buffer = options.Get(name).As<Napi::Buffer<uint8_t>>();
            out.assign(buffer.Data(), buffer.Data() + buffer.Length());
            return true;
        }

        // A positive integer property. Where it is optional, an absent one leaves out untouched.
        bool readCount(Napi::Env env, Napi::Object options, const char* name, size_t& out, bool required)
        {
            if (!options.Has(name) || options.Get(name).IsUndefined()) {
                if (required) {
                    Napi::TypeError::New(env, std::string("[NativeAppContext] Expected options.passwordHashing.") + name + " to be a number").ThrowAsJavaScriptException();
                }
                return !required;
            }
            Napi::Value value = options.Get(name);
            if (!value.IsNumber()) {
                Napi::TypeError::New(env, std::string("[NativeAppContext] Expected options.passwordHashing.") + name + " to be a number").ThrowAsJavaScriptException();
                return false;
            }
            double number = value.As<Napi::Number>().DoubleValue();
            if (number < 1 || number != static_cast<double>(static_cast<uint64_t>(number))) {
                Napi::TypeError::New(env, std::string("[NativeAppContext] Expected options.passwordHashing.") + name + " to be a positive integer").ThrowAsJavaScriptException();
                return false;
            }
            out = static_cast<size_t>(number);
            return true;
        }

        Napi::Object failure(Napi::Env env, const char* name, const std::string& message)
        {
            Napi::Object error = Napi::Object::New(env);
            error.Set("name", Napi::String::New(env, name));
            error.Set("message", Napi::String::New(env, message));
            Napi::Object result = Napi::Object::New(env);
            result.Set("success", Napi::Boolean::New(env, false));
            result.Set("error", error);
            return result;
        }
    } // namespace

    Napi::Object AppContext::Init(Napi::Env env, Napi::Object exports)
    {
        // both idempotent; the timer times the derivations, which only Windows needs set up for
        arnm_mono_timer_init();
        // the core may well have done it already
        if (sodium_init() < 0) {
            Napi::Error::New(env, "[NativeAppContext] sodium_init failed").ThrowAsJavaScriptException();
            return exports;
        }
        Napi::Function func = DefineClass(env, "NativeAppContext", {
            InstanceMethod("hashPassword", &AppContext::HashPassword),
            InstanceMethod("derivePinKey", &AppContext::DerivePinKey),
            InstanceMethod("getPasswordHashingStats", &AppContext::GetPasswordHashingStats),
            InstanceMethod("destroy", &AppContext::Destroy),
        });
        exports.Set("NativeAppContext", func);
        return exports;
    }

    AppContext::AppContext(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<AppContext>(info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1 || !info[0].IsObject()) {
            Napi::TypeError::New(env, "[NativeAppContext] Expected one argument: options ({ appSecret, serverKey, passwordHashing })").ThrowAsJavaScriptException();
            return;
        }
        Napi::Object options = info[0].As<Napi::Object>();
        if (!readBytes(env, options, "appSecret", mSecrets.appSecret) || !readBytes(env, options, "serverKey", mSecrets.serverKey)) {
            return;
        }
        if (mSecrets.appSecret.empty()) {
            Napi::TypeError::New(env, "[NativeAppContext] Expected options.appSecret not to be empty").ThrowAsJavaScriptException();
            return;
        }
        if (mSecrets.serverKey.size() != crypto_shorthash_KEYBYTES) {
            Napi::TypeError::New(
                env,
                "[NativeAppContext] Expected options.serverKey to be "
                + std::to_string(crypto_shorthash_KEYBYTES)
                + " bytes, got "
                + std::to_string(mSecrets.serverKey.size())
            ).ThrowAsJavaScriptException();
            return;
        }

        password::Difficulty difficulty = { 0, 0 };
        size_t threadCount = password::HashingPool::defaultThreadCount();
        size_t maxExpectedWaitMs = 0;
        // Required for the wait budget and the difficulty: those figures are decisions of the
        // TypeScript side (PASSWORD_HASH_MAX_EXPECTED_WAIT_MS in shared/src/const,
        // DEFAULT_PASSWORD_HASHING in shared's AppContext), not defaults of this one. Only the
        // thread count has its default here, from the hardware.
        if (!options.Has("passwordHashing") || !options.Get("passwordHashing").IsObject()) {
            Napi::TypeError::New(env, "[NativeAppContext] Expected options.passwordHashing to be an object").ThrowAsJavaScriptException();
            return;
        }
        {
            Napi::Object hashing = options.Get("passwordHashing").As<Napi::Object>();
            size_t opsLimit = 0;
            size_t memLimit = 0;
            if (!readCount(env, hashing, "maxExpectedWaitMs", maxExpectedWaitMs, true)
                || !readCount(env, hashing, "opsLimit", opsLimit, true)
                || !readCount(env, hashing, "memLimit", memLimit, true)
                || !readCount(env, hashing, "threadCount", threadCount, false)) {
                return;
            }
            if (opsLimit < crypto_pwhash_OPSLIMIT_MIN || memLimit < crypto_pwhash_MEMLIMIT_MIN) {
                Napi::TypeError::New(
                    env,
                    "[NativeAppContext] options.passwordHashing below what argon2id accepts: opsLimit >= "
                    + std::to_string(crypto_pwhash_OPSLIMIT_MIN)
                    + ", memLimit >= "
                    + std::to_string(crypto_pwhash_MEMLIMIT_MIN)
                ).ThrowAsJavaScriptException();
                return;
            }
            difficulty.opsLimit = opsLimit;
            difficulty.memLimit = memLimit;
        }
        mPasswordHashing = std::make_unique<password::HashingPool>(env, mSecrets, difficulty, threadCount, maxExpectedWaitMs);
    }

    AppContext::~AppContext()
    {
        sodium_memzero(mSecrets.appSecret.data(), mSecrets.appSecret.size());
        sodium_memzero(mSecrets.serverKey.data(), mSecrets.serverKey.size());
    }

    Napi::Value AppContext::HashPassword(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsNumber()) {
            Napi::TypeError::New(env, "[hashPassword] Expected three arguments: salt (string), password (string), priority (number)").ThrowAsJavaScriptException();
            return env.Null();
        }
        uint32_t priority = info[2].As<Napi::Number>().Uint32Value();
        if (priority != static_cast<uint32_t>(password::Priority::HIGH) && priority != static_cast<uint32_t>(password::Priority::LOW)) {
            Napi::TypeError::New(env, "[hashPassword] Expected priority to be 0 (high) or 1 (low), got " + std::to_string(priority)).ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!mPasswordHashing || !mPasswordHashing->isRunning()) {
            Napi::Error::New(env, "[hashPassword] The app context was destroyed").ThrowAsJavaScriptException();
            return env.Null();
        }

        auto deferred = Napi::Promise::Deferred::New(env);
        auto admission = mPasswordHashing->enqueue(
            env,
            static_cast<password::Priority>(priority),
            info[0].As<Napi::String>().Utf8Value(),
            info[1].As<Napi::String>().Utf8Value(),
            deferred
        );
        if (!admission.admitted) {
            auto stats = mPasswordHashing->stats();
            return failure(
                env,
                "PASSWORD_HASH_QUEUE_FULL",
                "an expected wait of " + std::to_string(static_cast<long long>(admission.expectedWaitMs))
                + " ms exceeds " + std::to_string(static_cast<long long>(stats.maxExpectedWaitMs))
                + " ms (" + std::to_string(stats.highPriorityQueued + stats.lowPriorityQueued) + " queued, "
                + std::to_string(static_cast<long long>(stats.averageDurationMs)) + " ms per derivation on "
                + std::to_string(stats.threadCount) + (stats.threadCount == 1 ? " thread)" : " threads)")
            );
        }
        Napi::Object result = Napi::Object::New(env);
        result.Set("success", Napi::Boolean::New(env, true));
        result.Set("value", deferred.Promise());
        return result;
    }

    Napi::Value AppContext::DerivePinKey(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 2 || !info[0].IsString() || !info[1].IsString()) {
            Napi::TypeError::New(env, "[derivePinKey] Expected two arguments: salt (string), pin (string)").ThrowAsJavaScriptException();
            return env.Null();
        }
        uint64_t key = password::derivePinKey(info[0].As<Napi::String>().Utf8Value(), info[1].As<Napi::String>().Utf8Value(), mSecrets);
        return Napi::BigInt::New(env, key);
    }

    Napi::Value AppContext::GetPasswordHashingStats(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        auto stats = mPasswordHashing->stats();
        Napi::Object result = Napi::Object::New(env);
        result.Set("threadCount", Napi::Number::New(env, static_cast<double>(stats.threadCount)));
        result.Set("maxExpectedWaitMs", Napi::Number::New(env, stats.maxExpectedWaitMs));
        result.Set("averageDurationMs", Napi::Number::New(env, stats.averageDurationMs));
        result.Set("expectedWaitMs", Napi::Number::New(env, stats.expectedWaitMs));
        result.Set("highPriorityQueued", Napi::Number::New(env, static_cast<double>(stats.highPriorityQueued)));
        result.Set("lowPriorityQueued", Napi::Number::New(env, static_cast<double>(stats.lowPriorityQueued)));
        return result;
    }

    Napi::Value AppContext::Destroy(const Napi::CallbackInfo& info)
    {
        if (mPasswordHashing) {
            mPasswordHashing->shutdown();
        }
        return info.Env().Undefined();
    }

} // namespace gradido
