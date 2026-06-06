#include "crypto.h"
#include "gradidoUnit.h"

#include <napi.h>

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("calculateDecay", Napi::Function::New(env, gradidoUnit::CalculateDecay));
    exports.Set("getDecayStartTime", Napi::Function::New(env, gradidoUnit::GetDecayStartTime));
    exports.Set("gradidoUnitFromString", Napi::Function::New(env, gradidoUnit::FromString));
    exports.Set("gradidoUnitToString", Napi::Function::New(env, gradidoUnit::ToString));
    exports.Set("toDecimalPlaces", Napi::Function::New(env, gradidoUnit::ToDecimalPlaces));
    exports.Set("durationToString", Napi::Function::New(env, gradidoUnit::DurationToString));
    exports.Set("signKeyPairGenerateFromSeed", Napi::Function::New(env, gradido::crypto::GenerateFromSeed));
    exports.Set("signKeyPairDerive", Napi::Function::New(env, gradido::crypto::Derive));
    exports.Set("signKeyPairDeriveUuid", Napi::Function::New(env, gradido::crypto::DeriveUuid));
    exports.Set("signKeyPairDeriveAccountFromCommunity", Napi::Function::New(env, gradido::crypto::DeriveAccountFromCommunity));

    return exports;
}

NODE_API_MODULE(SharedNative, Init)
