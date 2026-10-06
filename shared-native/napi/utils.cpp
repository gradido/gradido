#include "utils.h"

#include "arnm/duration.h"

#include "napi.h"

namespace gradido::utils {

    Napi::Object MonotonicTimer::Init(Napi::Env env, Napi::Object exports) {
        arnm_mono_timer_init();

        Napi::Function func = DefineClass(env, "MonotonicTimer", {
            InstanceMethod("reset", &MonotonicTimer::Reset),
            InstanceMethod("toString", &MonotonicTimer::ToString),
        });

        exports.Set("MonotonicTimer", func);
        return exports;
    }

    MonotonicTimer::MonotonicTimer(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<MonotonicTimer>(info)
    {
        arnm_mono_timer_reset(&mTimer);
    }

    MonotonicTimer::~MonotonicTimer() {
    }

    Napi::Value MonotonicTimer::Reset(const Napi::CallbackInfo& info) {
        arnm_mono_timer_reset(&mTimer);
        return info.Env().Undefined();
    }

    Napi::Value MonotonicTimer::ToString(const Napi::CallbackInfo& info) {
        char buffer[128];
        // buffer_size counts the terminator; a return of sizeof(buffer) or more means nothing
        // was written and the figure is what would have been needed.
        int written = arnm_mono_timer_string(buffer, sizeof(buffer), mTimer);
        arnm_mono_timer_reset(&mTimer);
        if (written < 0 || static_cast<size_t>(written) >= sizeof(buffer)) {
            Napi::Error::New(info.Env(), "[MonotonicTimer.toString] Duration string conversion failed").ThrowAsJavaScriptException();
            return info.Env().Null();
        }
        return Napi::String::New(info.Env(), buffer, written);
    }

    Napi::Value DurationToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "[durationToString] Expected at least one argument: duration: bigint").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBigInt()) {
            Napi::TypeError::New(env, "[durationToString] Expected duration to be a bigint").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (info.Length() > 1 && !info[1].IsNumber()) {
            Napi::TypeError::New(env, "[durationToString] Expected precision to be a number or undefined").ThrowAsJavaScriptException();
            return env.Null();
        }

        bool lossless = false;
        arnm_duration duration = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "[durationToString] BigInt duration is too large to fit in arnm_duration (int64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        uint8_t precision = 2;
        if (info.Length() > 1) {
            precision = info[1].As<Napi::Number>().Uint32Value();
        }
        char str[32];
        int written = arnm_duration_string(str, sizeof(str), duration, precision);
        if (written < 0 || static_cast<size_t>(written) >= sizeof(str)) {
            Napi::Error::New(env, "[durationToString] Duration string conversion failed").ThrowAsJavaScriptException();
            return env.Null();
        }
        return Napi::String::New(env, str, written);
    }
}
