#pragma once

#include <napi.h>

#include <string>

struct grdd_timestamp;
Napi::Value GrddTimestampToDate(const Napi::CallbackInfo& info, const grdd_timestamp* timestamp);
// get int64 from bigint
bool getInt64FromObject(const Napi::CallbackInfo& info, Napi::Object obj, const char* name, int64_t& out, bool required = true);
// get int32 from number or bigint
bool getInt32FromObject(const Napi::CallbackInfo& info, Napi::Object obj, const char* name, int32_t& out, bool required = true);

// Checks that value is a Buffer (or Uint8Array) of exactly `size` bytes and on success points
// out at it, without copying. Otherwise throws a TypeError "[where] Expected name to be ..."
// and returns false. A missing argument, info[index] past the last one, is undefined and fails
// the check like any other non-buffer.
bool readBytes(Napi::Env env, Napi::Value value, const char* where, const char* name, size_t size, Napi::Buffer<uint8_t>& out);

// The Result / VoidResult shapes of index.d.ts: { success: true, value } or { success: true },
// { success: false, error } -- error either given, or built as { name, message }
Napi::Object successResult(Napi::Env env, Napi::Value value);
Napi::Object successResult(Napi::Env env);
Napi::Object failureResult(Napi::Env env, Napi::Object error);
Napi::Object failureResult(Napi::Env env, const char* name, const std::string& message);
