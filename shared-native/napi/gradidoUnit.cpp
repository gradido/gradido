#include <napi.h>
#include "gradido_blockchain_core/data/unit.h"
#include "gradido_blockchain_core/const.h"

namespace gradidoUnit {
    Napi::Value CalculateDecay(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 2) {
            Napi::TypeError::New(env, "[calculateDecay] Expected two arguments, value: bigint, seconds: bigint").ThrowAsJavaScriptException();
            return env.Null();
        }

        if (!info[0].IsBigInt()) {
            Napi::TypeError::New(env, "[calculateDecay] Expected value to be a bigint").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[1].IsBigInt()) {
            Napi::TypeError::New(env, "[calculateDecay] Expected seconds to be a bigint").ThrowAsJavaScriptException();
            return env.Null();
        }

        bool lossless = false;
        int64_t amount = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "[calculateDecay] Value is to large for int64").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (amount < 0) {
            Napi::TypeError::New(env, "[calculateDecay] Value must be >= 0").ThrowAsJavaScriptException();
            return env.Null();
        }
        int64_t duration = info[1].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "[calculateDecay] Seconds is to large for int64").ThrowAsJavaScriptException();
            return env.Null();
        }
        grdd_unit result = grdd_unit_calculate_decay(amount, duration);
        if (result == INT64_MAX) {
            Napi::Error::New(env, "[calculateDecay] Decay calculation probably resulted in overflow").ThrowAsJavaScriptException();
            return env.Null();
        }

        return Napi::BigInt::New(env, result);
    }


    Napi::Value GetDecayStartTime(const Napi::CallbackInfo& info)
    {
        double timestamp = static_cast<double>(grdd_unit_decay_start_time()) * 1000.0;
        return Napi::Date::New(info.Env(), timestamp);
    }

    Napi::Value GetDecayRespiteCent(const Napi::CallbackInfo& info)
    {
      return Napi::BigInt::New(info.Env(), GRADIDO_DECAY_RESPITE_CENT);
    }

    Napi::Value FromString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "[gradidoUnitFromString] Expected one argument a string").ThrowAsJavaScriptException();
            return env.Null();
        }
        std::string str = info[0].As<Napi::String>();
        grdd_unit unit = 0;
        if(!grdd_unit_from_string(&unit, str.c_str())) {
            Napi::TypeError::New(
                env,
                "[gradidoUnitFromString] Invalid unit string. Must be a decimal with up to 4 fractional digits, "
                "integer part between -922'337'203'685'476 and 922'337'203'685'476."
            ).ThrowAsJavaScriptException();
            return env.Null();
        }
        return Napi::BigInt::New(env, unit);
    }

    Napi::Value ToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 1) {
            Napi::TypeError::New(env, "[gradidoUnitToString] Expected at least one argument (value: bigint, precision?: number)").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBigInt()) {
            Napi::TypeError::New(env, "[gradidoUnitToString] Expected value to be a bigint").ThrowAsJavaScriptException();
            return env.Null();
        }
        bool lossless = false;
        grdd_unit unit = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "[gradidoUnitToString] BigInt value is too large to fit in grdd_unit (int64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        uint8_t precision = 4;
        if (info.Length() > 1) {
            precision = info[1].As<Napi::Number>().Uint32Value();
        }
        if (precision > 4) {
            Napi::Error::New(env, "[gradidoUnitToString] Precision must be between 0 and 4").ThrowAsJavaScriptException();
            return env.Null();
        }
        // biggest string: -922337203685477.5807 (21 chars + null terminator = 22)
        constexpr size_t bufferSize = 22;
        char str[bufferSize];
        int written = grdd_unit_to_string(str, bufferSize, unit, precision);
        if (-1 == written) {
            Napi::Error::New(env, "[gradidoUnitToString] Rounding failed (overflow)").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (written +1 > bufferSize) {
            char* dynamicStr = new char[written + 1];
            int dynamicWritten = grdd_unit_to_string(dynamicStr, written + 1, unit, precision);
            Napi::String result = Napi::String::New(env, dynamicStr, dynamicWritten);
            delete[] dynamicStr;
            return result;
        }
        return Napi::String::New(env, str, written);
    }

    Napi::Value ToDecimalPlaces(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2) {
            Napi::TypeError::New(env, "[toDecimalPlaces] Expected two arguments: unit and places").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBigInt()) {
            Napi::TypeError::New(env, "[toDecimalPlaces] Expected unit to be a bigint").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[1].IsNumber()) {
            Napi::TypeError::New(env, "[toDecimalPlaces] Expected places to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        bool lossless = false;
        grdd_unit unit = info[0].As<Napi::BigInt>().Int64Value(&lossless);
        if (!lossless) {
            Napi::TypeError::New(env, "[toDecimalPlaces] BigInt value is too large to fit in grdd_unit (int64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        int places = info[1].As<Napi::Number>().Int32Value();
        grdd_unit rounded = 0;
        if(!grdd_unit_round_to_precision(&rounded, unit, places)) {
            Napi::TypeError::New(env, "[toDecimalPlaces] Rounding failed (overflow)").ThrowAsJavaScriptException();
            return env.Null();
        }
        return Napi::BigInt::New(env, rounded);
    }

}
