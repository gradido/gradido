#include "CompleteTransaction.h"

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/data/runtime/complete_transaction.h"
#include "gradido_blockchain_core/error_details.h"
#include "gradido_blockchain_core/interactions/validate/context.h"
#include "gradido_blockchain_core/interactions/validate/result_type.h"
#include "gradido_blockchain_core/interactions/validate/options.h"
#include "gradido_blockchain_core/result.h"
#include "gradido_blockchain_core/utils/converter.h"
#include "napi.h"

namespace gradido::data::runtime {
    
    Napi::Object CompleteTransaction::Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "CompleteTransaction", {
            InstanceMethod("initFromProtobuf", &CompleteTransaction::InitFromProtobuf),
            InstanceMethod("validate", &CompleteTransaction::Validate),
            InstanceMethod("getAccountBalanceForPublicKey", &CompleteTransaction::GetAccountBalanceForPublicKey),
            InstanceMethod("getSenderPublicKey", &CompleteTransaction::GetSenderPublicKey),
            InstanceMethod("getRecipientPublicKey", &CompleteTransaction::GetRecipientPublicKey),
            InstanceMethod("getSenderCommunityUuid", &CompleteTransaction::GetSenderCommunityUuid),
            InstanceMethod("getRecipientCommunityUuid", &CompleteTransaction::GetRecipientCommunityUuid),
            InstanceMethod("getRegisteredAccount", &CompleteTransaction::GetRegisteredAccount),
            InstanceMethod("getAmount", &CompleteTransaction::GetAmount),
            InstanceMethod("getTransactionType", &CompleteTransaction::GetTransactionType),
            InstanceMethod("getTargetDate", &CompleteTransaction::GetTargetDate),
            InstanceMethod("getTimeoutDuration", &CompleteTransaction::GetTimeoutDuration)
        });
        
        exports.Set("CompleteTransaction", func);
        return exports;
    }
    
    CompleteTransaction::CompleteTransaction(const Napi::CallbackInfo& info) 
        : Napi::ObjectWrap<CompleteTransaction>(info) 
    {   
        grdr_complete_transaction_init(&m_tx);   
    }
    
    CompleteTransaction::~CompleteTransaction() {
        grdr_complete_transaction_release(&m_tx);
    }

    Napi::Value CompleteTransaction::InitFromProtobuf(const Napi::CallbackInfo& info)
    {
        auto env = info.Env();
                
        if (info.Length() < 2) {
            throw Napi::Error::New(info.Env(), "Expected two arguments: serialized Transaction (UInt8Array) and community uuid (UInt8Array(16) or string(36))");
            return env.Undefined();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "Expected first argument to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        uint8_t communityUuid[UUID_BINARY_SIZE];
        if (info[1].IsBuffer()) {
            Napi::Buffer<uint8_t> communityUuidBuffer = info[1].As<Napi::Buffer<uint8_t>>();
            if (communityUuidBuffer.Length() != UUID_BINARY_SIZE) {
                Napi::TypeError::New(env, "Expected second argument to be size 16 as Uint8Array").ThrowAsJavaScriptException();
                return env.Undefined();
            }
            memcpy(communityUuid, communityUuidBuffer.Data(), UUID_BINARY_SIZE);
        } else if (info[1].IsString()) {
            auto communityUuidString = info[1].As<Napi::String>().Utf8Value();            
            if (communityUuidString.size() != 36) {
                Napi::TypeError::New(env, "Expected second argument to be size 36 as string").ThrowAsJavaScriptException();
                return env.Undefined();
            }
            grd_result result = grdu_uuid_from_string(communityUuid, communityUuidString.c_str());
            if (GRD_SUCCESS != result) {
                Napi::TypeError::New(env, "Expected second argument to be valid uuid string").ThrowAsJavaScriptException();
                return env.Undefined();
            }
        } else {
            Napi::TypeError::New(env, "Expected second argument to be a Uint8Array(16) or string(36)").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        Napi::Buffer<uint8_t> serializedTx = info[0].As<Napi::Buffer<uint8_t>>();

        int bufferSize = 4096;
        uint8_t* dynBuffer = nullptr;
        uint8_t buffer[bufferSize];
        grd_result init_result = grdr_complete_transaction_init_from_protobuf(
            &m_tx, 
            serializedTx.Data(), serializedTx.Length(), 
            communityUuid, 
            buffer, bufferSize
        );
        
        while(GRD_ERROR_OUT_OF_MEMORY == init_result || GRD_ERROR_DESTINATION_BUFFER_TO_SMALL == init_result) {
            bufferSize *= 2;
            // 1 MB should be more as enough
            if(bufferSize >= 1024 * 1024 * 1024) { break;}
            dynBuffer = (uint8_t*)malloc(bufferSize);
            init_result = grdr_complete_transaction_init_from_protobuf(
                &m_tx, 
                serializedTx.Data(), serializedTx.Length(), 
                communityUuid, 
                dynBuffer, bufferSize
            );
            free(dynBuffer);
        };
        Napi::Object result = Napi::Object::New(env);        
        if (GRD_SUCCESS != init_result) {
            std::string message = "deserialize or mapping failed: ";
            message += grd_result_to_string(init_result);
            Napi::Object error = Napi::Object::New(env);
            error.Set("name", Napi::String::New(env, grd_result_to_string(init_result)));
            error.Set("message", Napi::String::New(env, "Deserialize or mapping failed"));
            result.Set("success", Napi::Boolean::New(env, false));    
            result.Set("error", error);
            return result;
        }
        result.Set("success", Napi::Boolean::New(env, true));    
        return result;
    }

    Napi::Value CompleteTransaction::Validate(const Napi::CallbackInfo& info)
    {
        auto env = info.Env();
        bool verifySignatures = true;
        if (info.Length() >= 1) {
            if (info[0].IsBoolean()) {
                verifySignatures = info[0].As<Napi::Boolean>();
            }
        }
        
        grdi_validate_options opt = {
          .enable_verify = verifySignatures
        };
        grd_error_details errorDetails;
        uint8_t errorStringBuffer[256];
        grd_memory alloc;
        grd_memory_init_arena_static(&alloc, errorStringBuffer, 256);
        // error details will use malloc for error message, when alloc has run out of memory
        grd_result errorDetailsInitResult = grd_error_details_init(&errorDetails, &alloc);
        if (errorDetailsInitResult != GRD_SUCCESS) { 
            std::string message = "Error on error details init: ";
            message += grd_result_to_string(errorDetailsInitResult);
            Napi::TypeError::New(env, message.c_str()).ThrowAsJavaScriptException();
            return env.Undefined();
        }
        grdi_validate_result_type validateResult = grdi_validate_complete_transaction(&m_tx, &opt, &errorDetails);
        Napi::Object result = Napi::Object::New(env);
        if (validateResult != GRDI_VALIDATE_SUCCESS) {
            result.Set("success", Napi::Boolean::New(env, false));
            Napi::Object error = Napi::Object::New(env);
            error.Set("name", Napi::String::New(env, grdi_validate_result_to_string(validateResult)));
            if (errorDetails.message) {
                error.Set("message", Napi::String::New(env, errorDetails.message));
            }
            if (errorDetails.actual) {
                error.Set("actual", Napi::String::New(env, errorDetails.actual));
            }
            if (errorDetails.expected) {
                error.Set("expected", Napi::String::New(env, errorDetails.expected));
            }
            result.Set("error", error);        
        } else {
            result.Set("success", Napi::Boolean::New(env, true));
        }
        grd_error_details_release(&errorDetails);
        return result;
    }
    
    Napi::Value CompleteTransaction::GetSenderPublicKey(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        const uint8_t* key = grdr_complete_transaction_get_sender_public_key(&m_tx);
        if (!key) return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, key, SIGN_PUBLIC_KEY_SIZE);
    }

    Napi::Value CompleteTransaction::GetRecipientPublicKey(const Napi::CallbackInfo& info)
    {
        auto env = info.Env();
        const uint8_t* key = grdr_complete_transaction_get_recipient_public_key(&m_tx);
        if (!key) return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, key, SIGN_PUBLIC_KEY_SIZE);
    }

    Napi::Value CompleteTransaction::GetSenderCommunityUuid(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        const uint8_t* key = grdr_complete_transaction_get_sender_community_uuid(&m_tx);
        if (!key) return env.Null();
        
        char buffer[37];
        grdu_uuid_to_string(buffer, key);        
        return Napi::String::New(env, buffer);
    }
    
    Napi::Value CompleteTransaction::GetRecipientCommunityUuid(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        const uint8_t* key = grdr_complete_transaction_get_recipient_community_uuid(&m_tx);
        if (!key) return env.Null();
        
        char buffer[37];
        grdu_uuid_to_string(buffer, key);
        return Napi::String::New(env, buffer);
    }

    Napi::Value CompleteTransaction::GetRegisteredAccount(const Napi::CallbackInfo& info)
    {
        auto env = info.Env();
        const uint8_t* key = grdr_complete_transaction_get_registered_account(&m_tx);
        if (!key) return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, key, SIGN_PUBLIC_KEY_SIZE);
    }
    
    Napi::Value CompleteTransaction::GetAccountBalanceForPublicKey(const Napi::CallbackInfo& info)
    {
        auto env = info.Env();
        if (info.Length() < 1) {
            throw Napi::Error::New(info.Env(), "Expected one argument: publicKey as Uint8Array(32) or hex string (64)");
            return env.Undefined();
        }
        uint8_t publicKey[SIGN_PUBLIC_KEY_SIZE];
        if (info[0].IsBuffer()) {
            Napi::Buffer<uint8_t> publicKeyBuffer = info[0].As<Napi::Buffer<uint8_t>>();
            if (publicKeyBuffer.Length() != SIGN_PUBLIC_KEY_SIZE) {
                Napi::TypeError::New(env, "Expected first argument to be size 32 as Uint8Array").ThrowAsJavaScriptException();
                return env.Null();
            }
            memcpy(publicKey, publicKeyBuffer.Data(), SIGN_PUBLIC_KEY_SIZE);
        } else if (info[0].IsString()) {
            auto publicKeyString = info[0].As<Napi::String>().Utf8Value();            
            if (publicKeyString.size() != SIGN_PUBLIC_KEY_SIZE * 2) {
                Napi::TypeError::New(env, "Expected first argument to be size 64 as string").ThrowAsJavaScriptException();
                return env.Null();
            }
            grd_result result = grdu_binary_from_hex(publicKey, publicKeyString.c_str());
            if (GRD_SUCCESS != result) {
                Napi::TypeError::New(env, "Expected first argument to be valid hex string").ThrowAsJavaScriptException();
                return env.Null();
            }
        } else {
            Napi::TypeError::New(env, "Expected first argument to be a Uint8Array(32) or hex string (64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        const grdw_account_balance* account_balance = grdr_complete_transaction_get_account_balance_for_public_key(&m_tx, publicKey);
        if (!account_balance) {
            return env.Null();
        }
        
        Napi::Object result = Napi::Object::New(env);
        result.Set("balance", Napi::Number::New(env, grdw_account_balance_get_balance(account_balance)));
        result.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, grdw_account_balance_get_public_key(account_balance), SIGN_PUBLIC_KEY_SIZE));        
        // Community UUID as string
        char uuidString[37];
        grdu_uuid_to_string(uuidString, grdw_account_balance_get_community_uuid(account_balance));
        result.Set("communityUuid", Napi::String::New(env, uuidString));
        
        return result;
    }
    
    Napi::Value CompleteTransaction::GetTransactionType(const Napi::CallbackInfo& info) {
        return Napi::String::New(info.Env(), grdt_transaction_to_string(grdr_complete_transaction_get_transaction_type(&m_tx)));
    }
    
    Napi::Value CompleteTransaction::GetAmount(const Napi::CallbackInfo& info) {
        return Napi::BigInt::New(info.Env(), grdr_complete_transaction_get_amount(&m_tx));
    }

    Napi::Value CompleteTransaction::GetTargetDate(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        auto timestampSeconds = grdr_complete_transaction_get_target_date(&m_tx);
        if (timestampSeconds <= 0) {
            return env.Null();
        }
        return Napi::Date::New(env, static_cast<double>(timestampSeconds) * 1000.0);
    }
    Napi::Value CompleteTransaction::GetTimeoutDuration(const Napi::CallbackInfo& info) {
        return Napi::BigInt::New(info.Env(), grdr_complete_transaction_get_timeout_duration(&m_tx));
    }
}