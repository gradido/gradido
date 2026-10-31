#include <napi.h>

namespace gradido::crypto {
    Napi::Value GenerateFromSeed(const Napi::CallbackInfo& info);
    Napi::Value Derive(const Napi::CallbackInfo& info);
    Napi::Value DeriveUuid(const Napi::CallbackInfo& info);
    Napi::Value DeriveAccountFromCommunity(const Napi::CallbackInfo& info);

    Napi::Value HashGeneric(const Napi::CallbackInfo& info);
    // the generic hash of data (BLAKE2b, GENERIC_HASH_SIZE bytes) as a base64 string, for the other
    // bindings, not exported to JavaScript; throws and returns null if it fails
    Napi::Value HashGenericBase64(Napi::Env env, const uint8_t* data, size_t size);
    Napi::Value HashGenericBase64(const Napi::CallbackInfo& info);
} // namespace gradidoSign
