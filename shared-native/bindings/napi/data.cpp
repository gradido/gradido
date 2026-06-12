#include <cstddef>
#include <napi.h>
#include "gradido_blockchain_core/data/runtime/complete_transaction.h"

namespace gradido::data {
    namespace runtime {
        Napi::Value CompleteTransactionInit(const Napi::CallbackInfo& info)
        {
            Napi::Env env = info.Env();
            if (info.Length() != 0) {
                Napi::TypeError::New(env, "Expected 0 argument").ThrowAsJavaScriptException();
                return env.Null();
            }
            grdr_complete_transaction* tx = new grdr_complete_transaction;
            grdr_complete_transaction_init(tx);
            auto buffer = Napi::Buffer<grdr_complete_transaction>::New(
                env, 
                tx, 
                sizeof(grdr_complete_transaction),
                [](Napi::Env env, grdr_complete_transaction* data) {
                    grdr_complete_transaction_release(data);
                    delete data;
                }
            );
            
            return buffer;
        }

        static Napi::Value checkFor_grdr_complete_transaction(const Napi::CallbackInfo& info) {
            Napi::Env env = info.Env();
            if (info.Length() != 1) {
                Napi::TypeError::New(env, "Expected 1 argument, CompleteTransaction").ThrowAsJavaScriptException();
                return env.Null();
            }
            if (!info[0].IsBuffer()) {
                Napi::TypeError::New(env, "Expected first argument to be result of completeTransactionInit").ThrowAsJavaScriptException();
                return env.Null();
            }
            Napi::Buffer<uint8_t> buffer = info[0].As<Napi::Buffer<uint8_t>>();
            if (buffer.Length() != sizeof(grdr_complete_transaction)) {
                Napi::TypeError::New(env, "Expected first argument to be result of completeTransactionInit").ThrowAsJavaScriptException();
                return env.Null();
            }
            return buffer;
        }
        
        Napi::Value CompleteTransactionFromProtobuf(const Napi::CallbackInfo& info)
        {
            Napi::Env env = info.Env();
            
            auto complete_tx = CompleteTransactionInit(info);
            
            
        }
    }
}

