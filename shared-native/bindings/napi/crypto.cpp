#include <napi.h>
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/crypto/sign.h"
#include "gradido_blockchain_core/result.h"

namespace gradido::crypto {
    constexpr uint32_t MAX_DERIVATION_INDEX = 0x80000000 - 1;

    Napi::Value GenerateFromSeed(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one argument: seed (Uint8Array)").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "Expected first argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> seed = info[0].As<Napi::Buffer<uint8_t>>();

        // Result buffer: 32 bytes seed + 32 bytes public key + 32 bytes chain code = 96 bytes
        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        grd_result result = grdc_sign_key_pair_generate_from_seed(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            seed.Data(),
            seed.Length()
        );

        if (result != GRD_SUCCESS) {
            Napi::Error::New(env, std::string("Failed to generate ed25519 key pair, result: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value Derive(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 2) {
            Napi::TypeError::New(env, "Expected two arguments: parentKeyPair (Uint8Array of 96 bytes) and index (number)")
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "Expected first argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[1].IsNumber()) {
            Napi::TypeError::New(env, "Expected second argument to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> parentKeyPair = info[0].As<Napi::Buffer<uint8_t>>();
        if (parentKeyPair.Length() != sizeof(grdc_sign_key_pair)) {
            Napi::TypeError::New(
                env,
                "Expected parentKeyPair to be "
                + std::to_string(sizeof(grdc_sign_key_pair))
                + " Bytes, got "
                + std::to_string(parentKeyPair.Length())
            ).ThrowAsJavaScriptException();
            return env.Null();
        }

        uint32_t index = info[1].As<Napi::Number>().Uint32Value();

        if (index > MAX_DERIVATION_INDEX) {
            Napi::TypeError::New(env, "Max index value is: " + std::to_string(MAX_DERIVATION_INDEX) + ", but got: " + std::to_string(index))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        grd_result result = grdc_sign_key_pair_derive(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            reinterpret_cast<const grdc_sign_key_pair*>(parentKeyPair.Data()),
            index
        );

        if (result != GRD_SUCCESS) {
            Napi::Error::New(env, std::string("Failed to derive child sign key, result: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value DeriveUuid(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 2) {
            Napi::TypeError::New(env, "Expected two arguments: parentKeyPair (Uint8Array of 96 bytes) and uuid (Uint8Array of 16 bytes)")
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "Expected first argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[1].IsBuffer()) {
            Napi::TypeError::New(env, "Expected second argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> parentKeyPair = info[0].As<Napi::Buffer<uint8_t>>();
        if (parentKeyPair.Length() != sizeof(grdc_sign_key_pair)) {
            Napi::TypeError::New(
                env,
                "Expected parentKeyPair to be 96 Bytes, got "
                + std::to_string(parentKeyPair.Length())
                + " bytes"
            ).ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> uuid = info[1].As<Napi::Buffer<uint8_t>>();
        if (uuid.Length() != UUID_BINARY_SIZE) {
            Napi::TypeError::New(
                env,
                "Expected a valid uuid (16 Bytes), got "
                + std::to_string(uuid.Length())
                + " bytes"
            ).ThrowAsJavaScriptException();
            return env.Null();
        }

        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        grd_result result = grdc_sign_key_pair_derive_uuid(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            reinterpret_cast<const grdc_sign_key_pair*>(parentKeyPair.Data()),
            uuid.Data()
        );

        if (result != GRD_SUCCESS) {
            Napi::Error::New(env, std::string("UUID derivation failed: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

    Napi::Value DeriveAccountFromCommunity(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2 || info.Length() > 3) {
            Napi::TypeError::New(env, "Expected two or three arguments: communitySeed (Uint8Array of 32 bytes), userUuid (Uint8Array of 16 bytes), and optional accountNumber (number, default 1)")
                .ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "Expected first argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[1].IsBuffer()) {
            Napi::TypeError::New(env, "Expected second argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> communitySeed = info[0].As<Napi::Buffer<uint8_t>>();
        if (communitySeed.Length() != SIGN_SEED_SIZE) {
            Napi::TypeError::New(
                env,
                "Expected a valid community seed (32 Bytes), got "
                + std::to_string(communitySeed.Length())
                + " bytes"
            ).ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> userUuid = info[1].As<Napi::Buffer<uint8_t>>();
        if (userUuid.Length() != UUID_BINARY_SIZE) {
            Napi::TypeError::New(
                env,
                "Expected a valid uuid (16 Bytes), got "
                + std::to_string(userUuid.Length())
                + " bytes"
            ).ThrowAsJavaScriptException();
            return env.Null();
        }

        uint32_t accountNumber = 1;
        if (info.Length() > 2 && !info[2].IsUndefined()) {
            if (!info[2].IsNumber()) {
                Napi::TypeError::New(env, "Expected third argument to be a number").ThrowAsJavaScriptException();
                return env.Null();
            }
            accountNumber = info[2].As<Napi::Number>().Uint32Value();
        }

        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, sizeof(grdc_sign_key_pair));

        grd_result result = grdc_sign_key_pair_derive_account_from_community(
            reinterpret_cast<grdc_sign_key_pair*>(resultBuffer.Data()),
            communitySeed.Data(),
            userUuid.Data(),
            accountNumber
        );

        if (result != GRD_SUCCESS) {
            Napi::Error::New(env, std::string("Account derivation failed: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }

} // namespace gradido::crypto
