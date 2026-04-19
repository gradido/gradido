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
        double timestamp = static_cast<double>(grdd_unit_decay_start_time()) / 1000.0;
        return Napi::Date::New(info.Env(), timestamp);
    }

    
    Napi::Value FromString(const Napi::CallbackInfo& info) {
        if (info.Length() != 1) {
            Napi::TypeError::New(info.Env(), "Expected one argument").ThrowAsJavaScriptException();
            return info.Env().Null();
        }
        std::string str = info[0].As<Napi::String>();
        grdd_unit unit = 0;
        if(!grdd_unit_from_string(str.c_str(), &unit)) {
            Napi::TypeError::New(
                info.Env(),
                "Invalid unit string. Must be a decimal with up to 4 fractional digits, "
                "integer part between -922'337'203'685'476 and 922'337'203'685'476."
            ).ThrowAsJavaScriptException();
            return info.Env().Null();
        }
        return Napi::BigInt::New(info.Env(), unit);
    }
    
    Napi::Value ToString(const Napi::CallbackInfo& info) {
        if (info.Length() < 1) {
            Napi::TypeError::New(info.Env(), "Expected at least one argument").ThrowAsJavaScriptException();
            return info.Env().Null();
        }
        bool lossless = false;
        grdd_unit unit = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(info.Env(), "BigInt value is too large to fit in grdd_unit").ThrowAsJavaScriptException();
            return info.Env().Null();
        }
        uint8_t precision = 4;
        if (info.Length() > 1) {
            precision = info[1].As<Napi::Number>().Uint32Value();
        }
        if (precision > 4) {
            Napi::TypeError::New(info.Env(), "Precision must be between 0 and 4").ThrowAsJavaScriptException();
            return info.Env().Null();
        }
        // biggest string: -922337203685477.5807 (21 chars + null terminator = 22)
        char str[22];
        int written = grdd_unit_to_string(unit, str, precision);
        if (-1 == written) {
            Napi::TypeError::New(info.Env(), "Rounding failed (overflow)").ThrowAsJavaScriptException();
            return info.Env().Null();
        }
        return Napi::String::New(info.Env(), str, written);
    }

    Napi::Value ToDecimalPlaces(const Napi::CallbackInfo& info) {
        Napi::Env env = info.Env();
        if (info.Length() < 2) {
            Napi::TypeError::New(env, "Expected two arguments: unit and places").ThrowAsJavaScriptException();
            return env.Null();
        }
        
        bool lossless = false;
        grdd_unit unit = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "BigInt value is too large to fit in grdd_unit").ThrowAsJavaScriptException();
            return env.Null();
        }
        int places = info[1].As<Napi::Number>().Int32Value();
        grdd_unit rounded = 0;
        if(!grdd_unit_round_to_precision(unit, places, &rounded)) {
            Napi::TypeError::New(env, "Rounding failed (overflow)").ThrowAsJavaScriptException();
            return env.Null();
        }
        return Napi::BigInt::New(env, rounded);
    }

}

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("calculateDecay", Napi::Function::New(env, gradidoUnit::CalculateDecay));
    exports.Set("getDecayStartTime", Napi::Function::New(env, gradidoUnit::GetDecayStartTime));
    exports.Set("gradidoUnitFromString", Napi::Function::New(env, gradidoUnit::FromString));
    exports.Set("gradidoUnitToString", Napi::Function::New(env, gradidoUnit::ToString));
    exports.Set("toDecimalPlaces", Napi::Function::New(env, gradidoUnit::ToDecimalPlaces));
    return exports;
}

NODE_API_MODULE(GradidoUnit, Init)
