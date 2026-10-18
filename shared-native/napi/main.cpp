#include "AddonData.h"
#include "AppContext.h"
#include "CompleteTransaction.h"
#include "crypto.h"
#include "Ed25519KeyPair.h"
#include "gradidoUnit.h"
#include "image.h"
#include "LedgerAnchor.h"
#include "types.h"
#include "utils.h"
#include "X25519KeyPair.h"

#include <napi.h>

#include <sodium.h>

// Module initialization
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // first: everything below may use libsodium (randombytes, sodium_malloc, ...). Failing here
    // makes the require fail, instead of a broken addon that only shows it at its first use.
    if (sodium_init() < 0) {
        Napi::Error::New(env, "[shared-native] sodium_init failed").ThrowAsJavaScriptException();
        return exports;
    }
    if (!gradido::image::CheckAbi(env)) {
        return exports;
    }
    // functions
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
    exports.Set("grdtCrossGroupToString", Napi::Function::New(env, gradido::types::GrdtCrossGroupToString));
    exports.Set("grdtLedgerAnchorToString", Napi::Function::New(env, gradido::types::GrdtLedgerAnchorToString));
    exports.Set("grdtMemoKeyToString", Napi::Function::New(env, gradido::types::GrdtMemoKeyToString));
    exports.Set("grdtTransactionToString", Napi::Function::New(env, gradido::types::GrdtTransactionToString));
    exports.Set("probeImage", Napi::Function::New(env, gradido::image::Probe));
    exports.Set("reencodeImage", Napi::Function::New(env, gradido::image::Reencode));

    // classes
    // before the classes' Init: they keep their constructors in it
    env.SetInstanceData<gradido::AddonData>(new gradido::AddonData());
    gradido::AppContext::Init(env, exports);
    gradido::data::runtime::CompleteTransaction::Init(env, exports);
    gradido::utils::MonotonicTimer::Init(env, exports);
    gradido::data::wire::LedgerAnchor::Init(env, exports);
    gradido::crypto::Ed25519KeyPair::Init(env, exports);
    gradido::crypto::X25519KeyPair::Init(env, exports);

    return exports;
}

NODE_API_MODULE(SharedNative, Init)
