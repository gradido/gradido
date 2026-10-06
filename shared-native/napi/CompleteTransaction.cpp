#include "CompleteTransaction.h"
#include "LedgerAnchor.h"
#include "napiUtils.h"

#include "gradido_blockchain_core/const.h"
#include "gradido_blockchain_core/data/runtime/complete_transaction.h"
#include "gradido_blockchain_core/error_details.h"
#include "gradido_blockchain_core/interactions/validate/context.h"
#include "gradido_blockchain_core/interactions/validate/result_type.h"
#include "gradido_blockchain_core/interactions/validate/options.h"
#include "gradido_blockchain_core/result.h"
// arena.h and not memory.h: arnm 0.6.0 split arnm_init_arena_borrow() out into its own
// header, which includes memory.h, so nothing else had to move with it.
#include "arnm/arena.h"
#include "arnm/converter.h"
#include "napi.h"

using gradido::data::wire::LedgerAnchor;

namespace gradido::data::runtime {

    Napi::Object CompleteTransaction::Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "NativeCompleteTransaction", {
            InstanceMethod("initFromProtobuf", &CompleteTransaction::InitFromProtobuf),
            InstanceMethod("validate", &CompleteTransaction::Validate),
            InstanceMethod("getConfirmedAt", &CompleteTransaction::GetConfirmedAt),
            InstanceMethod("getCreatedAt", &CompleteTransaction::GetCreatedAt),
            InstanceMethod("getLedgerAnchor", &CompleteTransaction::GetLedgerAnchor),
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

        exports.Set("NativeCompleteTransaction", func);
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
            Napi::TypeError::New(info.Env(), "[CompleteTransaction.initFromProtobuf] Expected two arguments: serialized Transaction (UInt8Array) and community uuid (UInt8Array(16) or string(36))").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[CompleteTransaction.initFromProtobuf] Expected serialized to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        uint8_t communityUuid[ARNM_UUID_BINARY_SIZE];
        if (info[1].IsBuffer()) {
            Napi::Buffer<uint8_t> communityUuidBuffer = info[1].As<Napi::Buffer<uint8_t>>();
            if (communityUuidBuffer.Length() != ARNM_UUID_BINARY_SIZE) {
                Napi::TypeError::New(env, "[CompleteTransaction.initFromProtobuf] Expected communityUuid to be size 16 as Uint8Array").ThrowAsJavaScriptException();
                return env.Undefined();
            }
            memcpy(communityUuid, communityUuidBuffer.Data(), ARNM_UUID_BINARY_SIZE);
        } else if (info[1].IsString()) {
            auto communityUuidString = info[1].As<Napi::String>().Utf8Value();
            if (communityUuidString.size() != 36) {
                Napi::TypeError::New(env, "[CompleteTransaction.initFromProtobuf] Expected communityUuid to be size 36 as string").ThrowAsJavaScriptException();
                return env.Undefined();
            }
            arnm_result result = arnm_uuid_from_string(communityUuid, communityUuidString.c_str());
            if (ARNM_SUCCESS != result) {
                Napi::TypeError::New(env, "[CompleteTransaction.initFromProtobuf] Expected communityUuid to be valid uuid string").ThrowAsJavaScriptException();
                return env.Undefined();
            }
        } else {
            Napi::TypeError::New(env, "[CompleteTransaction.initFromProtobuf] Expected communityUuid to be a Uint8Array(16) or string(36)").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        Napi::Buffer<uint8_t> serializedTx = info[0].As<Napi::Buffer<uint8_t>>();
        if (serializedTx.Length() > UINT32_MAX) {
            Napi::TypeError::New(env, "[CompleteTransaction.initFromProtobuf] serialized transaction is too large").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        const uint32_t serializedLength = static_cast<uint32_t>(serializedTx.Length());

        // The buffer is a scratch arena for decoding, so arnm wants it 8 byte aligned with a
        // capacity that is a multiple of 8 - it refuses anything else instead of rounding.
        constexpr uint32_t STACK_BUFFER_SIZE = 4096;
        alignas(8) uint8_t buffer[STACK_BUFFER_SIZE];
        arnm_result init_result = grdr_complete_transaction_init_from_protobuf(
            &m_tx,
            serializedTx.Data(), serializedLength,
            communityUuid,
            buffer, STACK_BUFFER_SIZE
        );

        uint32_t bufferSize = STACK_BUFFER_SIZE;
        while(ARNM_ERROR_OUT_OF_MEMORY == init_result || ARNM_ERROR_DESTINATION_BUFFER_TO_SMALL == init_result) {
            bufferSize *= 2;
            // 1 MB should be more as enough
            if(bufferSize >= 1024 * 1024) { break;}
            // malloc is aligned for any fundamental type, so the arena's 8 bytes are covered
            uint8_t* dynBuffer = (uint8_t*)malloc(bufferSize);
            if (!dynBuffer) {
                init_result = ARNM_ERROR_OUT_OF_MEMORY;
                break;
            }
            init_result = grdr_complete_transaction_init_from_protobuf(
                &m_tx,
                serializedTx.Data(), serializedLength,
                communityUuid,
                dynBuffer, bufferSize
            );
            // the scratch arena is only read while decoding; what is kept lives in m_tx's own memory
            free(dynBuffer);
        };
        Napi::Object result = Napi::Object::New(env);
        if (ARNM_SUCCESS != init_result) {
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
        // 8 byte aligned and a multiple of 8, which is what arnm_init_arena_borrow requires
        alignas(8) uint8_t errorStringBuffer[256];
        arnm alloc = {};
        arnm_init_arena_borrow(&alloc, errorStringBuffer, sizeof(errorStringBuffer));
        // error details will use malloc for error message, when alloc has run out of memory
        arnm_result errorDetailsInitResult = grd_error_details_init(&errorDetails, &alloc);
        if (errorDetailsInitResult != ARNM_SUCCESS) {
            std::string message = "[CompleteTransaction.validate] Error on error details init: ";
            message += grd_result_to_string(errorDetailsInitResult);
            Napi::Error::New(env, message.c_str()).ThrowAsJavaScriptException();
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

    Napi::Value CompleteTransaction::GetConfirmedAt(const Napi::CallbackInfo& info) {
        return GrddTimestampToDate(info, &m_tx.confirmed_at);
    }
    Napi::Value CompleteTransaction::GetCreatedAt(const Napi::CallbackInfo& info) {
        return GrddTimestampToDate(info, &m_tx.created_at);
    }
    Napi::Value CompleteTransaction::GetLedgerAnchor(const Napi::CallbackInfo& info) {
        auto env = info.Env();

        // LedgerAnchor
        Napi::Value newLedgerAnchor = LedgerAnchor::CreateCopy(info, &m_tx.ledger_anchor); // crash
        if (!newLedgerAnchor.IsObject()) {
            Napi::Error::New(env, "[CompleteTransaction.getLedgerAnchor] LedgerAnchor.Create did not return an object").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        return newLedgerAnchor;
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
        arnm_uuid_to_string(buffer, key);
        return Napi::String::New(env, buffer);
    }

    Napi::Value CompleteTransaction::GetRecipientCommunityUuid(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        const uint8_t* key = grdr_complete_transaction_get_recipient_community_uuid(&m_tx);
        if (!key) return env.Null();

        char buffer[37];
        arnm_uuid_to_string(buffer, key);
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
            Napi::TypeError::New(info.Env(), "[CompleteTransaction.getAccountBalanceForPublicKey] Expected one argument: publicKey as Uint8Array(32) or hex string (64)").ThrowAsJavaScriptException();
            return env.Undefined();
        }
        uint8_t publicKey[SIGN_PUBLIC_KEY_SIZE];
        if (info[0].IsBuffer()) {
            Napi::Buffer<uint8_t> publicKeyBuffer = info[0].As<Napi::Buffer<uint8_t>>();
            if (publicKeyBuffer.Length() != SIGN_PUBLIC_KEY_SIZE) {
                Napi::TypeError::New(env, "[CompleteTransaction.getAccountBalanceForPublicKey] Expected publicKey to be size 32 as Uint8Array").ThrowAsJavaScriptException();
                return env.Null();
            }
            memcpy(publicKey, publicKeyBuffer.Data(), SIGN_PUBLIC_KEY_SIZE);
        } else if (info[0].IsString()) {
            auto publicKeyString = info[0].As<Napi::String>().Utf8Value();
            if (publicKeyString.size() != SIGN_PUBLIC_KEY_SIZE * 2) {
                Napi::TypeError::New(env, "[CompleteTransaction.getAccountBalanceForPublicKey] Expected publicKey to be size 64 as string").ThrowAsJavaScriptException();
                return env.Null();
            }
            arnm_result result = arnm_binary_from_hex(publicKey, publicKeyString.c_str());
            if (ARNM_SUCCESS != result) {
                Napi::TypeError::New(env, "[CompleteTransaction.getAccountBalanceForPublicKey] Expected publicKey to be valid hex string as string").ThrowAsJavaScriptException();
                return env.Null();
            }
        } else {
            Napi::TypeError::New(env, "[CompleteTransaction.getAccountBalanceForPublicKey] Expected publicKey to be a Uint8Array(32) or hex string (64)").ThrowAsJavaScriptException();
            return env.Null();
        }
        const grdw_account_balance* account_balance = grdr_complete_transaction_get_account_balance_for_public_key(&m_tx, publicKey);
        if (!account_balance) {
            return env.Null();
        }

        Napi::Object result = Napi::Object::New(env);
        result.Set("balance", Napi::BigInt::New(env, grdw_account_balance_get_balance(account_balance)));
        result.Set("publicKey", Napi::Buffer<uint8_t>::Copy(env, grdw_account_balance_get_public_key(account_balance), SIGN_PUBLIC_KEY_SIZE));
        // Community UUID as string
        char uuidString[37];
        arnm_uuid_to_string(uuidString, grdw_account_balance_get_community_uuid(account_balance));
        result.Set("coinCommunityUuid", Napi::String::New(env, uuidString));

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
