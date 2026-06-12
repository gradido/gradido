#include "utils.h"

#include "gradido_blockchain_core/utils/duration.h"

#include "napi.h"

namespace gradido::utils {

    Napi::Object MonotonicTimer::Init(Napi::Env env, Napi::Object exports) {
        grdu_mono_timer_init();
        
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
        grdu_mono_timer_reset(&mTimer);   
    }
    
    MonotonicTimer::~MonotonicTimer() {
    }

    Napi::Value MonotonicTimer::Reset(const Napi::CallbackInfo& info) {
        grdu_mono_timer_reset(&mTimer);
        return info.Env().Undefined();
    }
    
    Napi::Value MonotonicTimer::ToString(const Napi::CallbackInfo& info) {
        char buffer[128];
        auto written = grdu_mono_timer_string(buffer, 128, mTimer);
        grdu_mono_timer_reset(&mTimer);
        return Napi::String::New(info.Env(), buffer, written);
    }
    
    Napi::Value DurationToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "Expected at least one argument: duration").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBigInt()) {
            Napi::TypeError::New(env, "Expected first argument to be a bigint").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (info.Length() > 1 && !info[1].IsNumber()) {
            Napi::TypeError::New(env, "Expected second argument to be a number or undefined").ThrowAsJavaScriptException();
            return env.Null();
        }
    
        bool lossless = false;
        grdu_duration duration = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "BigInt value is too large to fit in grdu_duration (int64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        uint8_t precision = 2;
        if (info.Length() > 1) {
            precision = info[1].As<Napi::Number>().Uint32Value();
        }
        char str[32];
        int written = grdu_duration_string(str, sizeof(str), duration, precision);
        if (written < 0) {
            Napi::TypeError::New(env, "Duration string conversion failed").ThrowAsJavaScriptException();
            return env.Null();
        }
        return Napi::String::New(env, str, written);
    }
}