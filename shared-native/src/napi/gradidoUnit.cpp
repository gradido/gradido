#include <napi.h>
#include "../c/unit.h"

namespace gradidoUnit {
    Napi::Value CalculateDecay(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (info.Length() != 2) {
            Napi::TypeError::New(env, "Expected two arguments").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        bool lossless = false;
        int64_t amount = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "Expected first argument to be a bigint (int64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        int64_t duration = info[1].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "Expected second argument to be a bigint (int64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        grdd_unit result = grdd_unit_calculate_decay(amount, duration);
        
        return Napi::BigInt::New(env, result);
    }

    
    Napi::Value GetDecayStartTime(const Napi::CallbackInfo& info) {
        double timestamp = static_cast<double>(get_decay_start_time()) / 1000.0;
        return Napi::Date::New(info.Env(), timestamp);
    }
}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("calculateDecay", Napi::Function::New(env, gradidoUnit::CalculateDecay));
    exports.Set("getDecayStartTime", Napi::Function::New(env, gradidoUnit::GetDecayStartTime));
    return exports;
}

NODE_API_MODULE(GradidoUnit, Init)
