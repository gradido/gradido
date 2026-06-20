#include <napi.h>

namespace gradidoUnit {
    Napi::Value CalculateDecay(const Napi::CallbackInfo& info);
    Napi::Value GetDecayStartTime(const Napi::CallbackInfo& info);
    Napi::Value GetDecayRespiteCent(const Napi::CallbackInfo& info);
    Napi::Value FromString(const Napi::CallbackInfo& info);
    Napi::Value ToString(const Napi::CallbackInfo& info);
    Napi::Value ToDecimalPlaces(const Napi::CallbackInfo& info);
}
