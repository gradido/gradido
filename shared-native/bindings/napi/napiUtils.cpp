#include "napiUtils.h"
#include "gradido_blockchain_core/data/timestamp.h"

#include <napi.h>

Napi::Value GrddTimestampToDate(const Napi::CallbackInfo& info, const grdd_timestamp* timestamp)
{
    double seconds = static_cast<double>(timestamp->seconds);
    double nanos = static_cast<double>(timestamp->nanos);
    return Napi::Date::New(info.Env(), seconds * 1000.0 + nanos / 1000000.0);
}

bool getInt64FromObject(const Napi::CallbackInfo& info, Napi::Object obj, const char* name, int64_t& out, bool required/* = true */) {
    if (!obj.Has(name)) return !required;
    auto env = info.Env();
    auto val = obj.Get(name);
    if (!val.IsBigInt()) {
        Napi::TypeError::New(env, std::string(name) + " must be a bigint").ThrowAsJavaScriptException();
        return false;
    }
    bool lossless;
    out = val.As<Napi::BigInt>().Int64Value(&lossless);
    if (!lossless) {
        Napi::Error::New(env, std::string(name) + " is too large").ThrowAsJavaScriptException();
        return false;
    }
    return true;
};

bool getInt32FromObject(const Napi::CallbackInfo& info, Napi::Object obj, const char* name, int32_t& out, bool required/* = true */)
{
  if (!obj.Has(name)) return !required;
  auto env = info.Env();
  auto val = obj.Get(name);
  if (!val.IsNumber() || !val.IsBigInt()) {
      Napi::TypeError::New(env, std::string(name) + " must be a bigint or number").ThrowAsJavaScriptException();
      return false;
  }
  if (val.IsNumber()) {
    out = val.As<Napi::Number>();
  } else {
    bool lossless;
    int64_t value = val.As<Napi::BigInt>().Int64Value(&lossless);
    if (!lossless || value != static_cast<int64_t>(static_cast<int32_t>(value))) {
        Napi::Error::New(env, std::string(name) + " is too large").ThrowAsJavaScriptException();
        return false;
    }
    out = static_cast<int32_t>(value);
  }
  return true;
}
