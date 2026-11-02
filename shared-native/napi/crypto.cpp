#include <napi.h>
#include "napiUtils.h"
#include "arnm/converter.h"
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/crypto/hash.h"
#include "gradido_blockchain_core/crypto/sign.h"
#include "gradido_blockchain_core/result.h"

#include <sodium.h>

namespace gradido::crypto {
    constexpr uint32_t MAX_DERIVATION_INDEX = 0x80000000 - 1;

    Napi::Value GenerateFromSeed(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "[signKeyPairGenerateFromSeed] Expected one argument: seed (Uint8Array)").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[signKeyPairGenerateFromSeed] Expected first argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> seed = info[0].As<Napi::Buffer<uint8_t>>();

        // Result buffer: 32 bytes seed + 32 bytes public key + 32 bytes chain code = 96 bytes
        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        arnm_result result = grdc_sign_key_pair_generate_from_seed(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            seed.Data(),
            seed.Length()
        );

        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[signKeyPairGenerateFromSeed] Failed to generate ed25519 key pair, result: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value Derive(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 2) {
            Napi::TypeError::New(env, "[signKeyPairDerive] Expected two arguments: parentKeyPair (Uint8Array of 96 bytes) and index (number)")
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> parentKeyPair;
        if (!readBytes(env, info[0], "signKeyPairDerive", "parentKeyPair", sizeof(grdc_sign_key_pair), parentKeyPair)) {
            return env.Null();
        }
        if (!info[1].IsNumber()) {
            Napi::TypeError::New(env, "[signKeyPairDerive] Expected index to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        uint32_t index = info[1].As<Napi::Number>().Uint32Value();

        if (index > MAX_DERIVATION_INDEX) {
            Napi::TypeError::New(env, "[signKeyPairDerive] Max index value is: " + std::to_string(MAX_DERIVATION_INDEX) + ", but got: " + std::to_string(index))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        arnm_result result = grdc_sign_key_pair_derive(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            reinterpret_cast<const grdc_sign_key_pair*>(parentKeyPair.Data()),
            index
        );

        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[signKeyPairDerive] Failed to derive child sign key, result: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value DeriveUuid(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 2) {
            Napi::TypeError::New(env, "[signKeyPairDeriveUuid] Expected two arguments: parentKeyPair (Uint8Array of 96 bytes) and uuid (Uint8Array of 16 bytes)")
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> parentKeyPair;
        Napi::Buffer<uint8_t> uuid;
        if (!readBytes(env, info[0], "signKeyPairDeriveUuid", "parentKeyPair", sizeof(grdc_sign_key_pair), parentKeyPair)
            || !readBytes(env, info[1], "signKeyPairDeriveUuid", "uuid", ARNM_UUID_BINARY_SIZE, uuid)) {
            return env.Null();
        }

        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        arnm_result result = grdc_sign_key_pair_derive_uuid(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            reinterpret_cast<const grdc_sign_key_pair*>(parentKeyPair.Data()),
            uuid.Data()
        );

        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[signKeyPairDeriveUuid] UUID derivation failed: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value DeriveAccountFromCommunity(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2 || info.Length() > 3) {
            Napi::TypeError::New(env, "[signKeyPairDeriveAccountFromCommunity] Expected two or three arguments: communitySeed (Uint8Array of 32 bytes), userUuid (Uint8Array of 16 bytes), and optional accountNumber (number, default 1)")
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> communitySeed;
        Napi::Buffer<uint8_t> userUuid;
        if (!readBytes(env, info[0], "signKeyPairDeriveAccountFromCommunity", "communitySeed", SIGN_SEED_SIZE, communitySeed)
            || !readBytes(env, info[1], "signKeyPairDeriveAccountFromCommunity", "userUuid", ARNM_UUID_BINARY_SIZE, userUuid)) {
            return env.Null();
        }

        uint32_t accountNumber = 1;
        if (info.Length() > 2 && !info[2].IsUndefined()) {
            if (!info[2].IsNumber()) {
                Napi::TypeError::New(env, "[signKeyPairDeriveAccountFromCommunity] Expected accountNumber to be a number").ThrowAsJavaScriptException();
                return env.Null();
            }
            accountNumber = info[2].As<Napi::Number>().Uint32Value();
        }

        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        arnm_result result = grdc_sign_key_pair_derive_account_from_community(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            communitySeed.Data(),
            userUuid.Data(),
            accountNumber
        );

        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[signKeyPairDeriveAccountFromCommunity] Account derivation failed: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value HashGeneric(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "[hashGeneric] Expected one argument: data (Uint8Array)").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[hashGeneric] Expected data to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> data = info[0].As<Napi::Buffer<uint8_t>>();
        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, GENERIC_HASH_SIZE);

        arnm_result result = grdc_hash_generic(resultBuffer.Data(), data.Data(), data.Length());

        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[hashGeneric] Failed to calculate generic hash, result: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value HashGenericBase64(Napi::Env env, const uint8_t* data, size_t size)
    {
        uint8_t hash[GENERIC_HASH_SIZE];
        arnm_result result = grdc_hash_generic(hash, data, size);
        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[hashGenericBase64] Failed to calculate generic hash, result: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        // a hash is public, arnm's base64 not being constant time carries nothing here
        char base64[ARNM_BASE64_STRING_LENGTH(GENERIC_HASH_SIZE) + 1];
        result = arnm_binary_to_base64(base64, hash, GENERIC_HASH_SIZE);
        if (result != ARNM_SUCCESS) {
            Napi::Error::New(env, std::string("[hashGenericBase64] arnm_binary_to_base64 failed: ") + arnm_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        return Napi::String::New(env, base64);
    }

    Napi::Value HashGenericBase64(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "[hashGenericBase64] Expected one argument: data (string or Uint8Array)").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (info[0].IsString()) {
            std::string data = info[0].As<Napi::String>().Utf8Value();
            return HashGenericBase64(env, reinterpret_cast<const uint8_t*>(data.data()), data.size());
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[hashGenericBase64] Expected data to be a string or Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> data = info[0].As<Napi::Buffer<uint8_t>>();
        return HashGenericBase64(env, data.Data(), data.Length());
    }

    Napi::Value SignatureVerify(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[signatureVerify] Expected message to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> message = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Buffer<uint8_t> signature;
        Napi::Buffer<uint8_t> publicKey;
        if (!readBytes(env, info[1], "signatureVerify", "signature", crypto_sign_BYTES, signature)
            || !readBytes(env, info[2], "signatureVerify", "publicKey", crypto_sign_PUBLICKEYBYTES, publicKey)) {
            return env.Null();
        }
        return Napi::Boolean::New(env, crypto_sign_verify_detached(signature.Data(), message.Data(), message.Length(), publicKey.Data()) == 0);
    }

} // namespace gradido::crypto
