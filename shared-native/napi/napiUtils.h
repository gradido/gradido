#include <napi.h>

struct grdd_timestamp;
Napi::Value GrddTimestampToDate(const Napi::CallbackInfo& info, const grdd_timestamp* timestamp);
// get int64 from bigint
bool getInt64FromObject(const Napi::CallbackInfo& info, Napi::Object obj, const char* name, int64_t& out, bool required = true);
// get int32 from number or bigint
bool getInt32FromObject(const Napi::CallbackInfo& info, Napi::Object obj, const char* name, int32_t& out, bool required = true);
