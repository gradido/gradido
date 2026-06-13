#include <napi.h>

struct grdd_timestamp;
Napi::Value GrddTimestampToDate(const Napi::CallbackInfo& info, const grdd_timestamp* timestamp);