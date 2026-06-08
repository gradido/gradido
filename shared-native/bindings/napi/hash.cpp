
#include <napi.h>
#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/crypto/hash.h"
#include "gradido_blockchain_core/result.h"

namespace gradido::crypto {

    Napi::Value HashGeneric(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one arguments: data (Uint8Array)").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "Expected first argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Buffer<uint8_t> data = info[0].As<Napi::Buffer<uint8_t>>();
        auto resultBuffer = Napi::Buffer<uint8_t>::New(env, GENERIC_HASH_SIZE);

        grd_result result = grdc_hash_generic(resultBuffer.Data(), data.Data(), data.Length());

        if (result != GRD_SUCCESS) {
            Napi::Error::New(env, std::string("Failed to calculate generic hash, result: ") + grd_result_to_string(result))
                .ThrowAsJavaScriptException();
            return env.Null();
        }

        return resultBuffer;
    }
} // namespace gradido::crypto
