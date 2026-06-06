#include <napi.h>

namespace gradido::crypto {
    Napi::Value GenerateFromSeed(const Napi::CallbackInfo& info);
    Napi::Value Derive(const Napi::CallbackInfo& info);
    Napi::Value DeriveUuid(const Napi::CallbackInfo& info);
    Napi::Value DeriveAccountFromCommunity(const Napi::CallbackInfo& info);
} // namespace gradidoSign
