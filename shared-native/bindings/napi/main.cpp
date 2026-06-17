#include "CompleteTransaction.h"
#include "crypto.h"
#include "gradidoUnit.h"
#include "LedgerAnchor.h"
#include "types.h"
#include "utils.h"

#include <napi.h>

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("calculateDecay", Napi::Function::New(env, gradidoUnit::CalculateDecay));
    exports.Set("getDecayStartTime", Napi::Function::New(env, gradidoUnit::GetDecayStartTime));
    exports.Set("getDecayRespiteCent", Napi::Function::New(env, gradidoUnit::GetDecayRespiteCent));
    exports.Set("gradidoUnitFromString", Napi::Function::New(env, gradidoUnit::FromString));
    exports.Set("gradidoUnitToString", Napi::Function::New(env, gradidoUnit::ToString));
    exports.Set("toDecimalPlaces", Napi::Function::New(env, gradidoUnit::ToDecimalPlaces));
    exports.Set("durationToString", Napi::Function::New(env, gradido::utils::DurationToString));
    exports.Set("signKeyPairGenerateFromSeed", Napi::Function::New(env, gradido::crypto::GenerateFromSeed));
    exports.Set("signKeyPairDerive", Napi::Function::New(env, gradido::crypto::Derive));
    exports.Set("signKeyPairDeriveUuid", Napi::Function::New(env, gradido::crypto::DeriveUuid));
    exports.Set("signKeyPairDeriveAccountFromCommunity", Napi::Function::New(env, gradido::crypto::DeriveAccountFromCommunity));
    exports.Set("hashGeneric", Napi::Function::New(env, gradido::crypto::HashGeneric));
    exports.Set("grdtAddressToString", Napi::Function::New(env, gradido::types::GrdtAddressToString));
    exports.Set("grdtBalanceDerivationToString", Napi::Function::New(env, gradido::types::GrdtBalanceDerivationToString));
    exports.Set("grdtCrossGroupToString", Napi::Function::New(env, gradido::types::GrdtCrossGroupToString));
    exports.Set("grdtLedgerAnchorToString", Napi::Function::New(env, gradido::types::GrdtLedgerAnchorToString));
    exports.Set("grdtMemoKeyToString", Napi::Function::New(env, gradido::types::GrdtMemoKeyToString));
    exports.Set("grdtTransactionToString", Napi::Function::New(env, gradido::types::GrdtTransactionToString));

    gradido::data::runtime::CompleteTransaction::Init(env, exports);
    gradido::utils::MonotonicTimer::Init(env, exports);
    gradido::data::wire::LedgerAnchor::Init(env, exports);

    return exports;
}

NODE_API_MODULE(SharedNative, Init)
