#include "napiUtils.h"
#include "gradido_blockchain_core/data/timestamp.h"

#include <napi.h>

Napi::Value GrddTimestampToDate(const Napi::CallbackInfo& info, const grdd_timestamp* timestamp)
{
    double seconds = static_cast<double>(timestamp->seconds);
    double nanos = static_cast<double>(timestamp->nanos);
    return Napi::Date::New(info.Env(), seconds * 1000.0 + nanos / 1000.0);
}