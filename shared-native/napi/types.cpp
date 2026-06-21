
#include <napi.h>
#include "gradido_blockchain_core/types/address.h"
#include "gradido_blockchain_core/types/balance_derivation.h"
#include "gradido_blockchain_core/types/cross_group.h"
#include "gradido_blockchain_core/types/ledger_anchor.h"
#include "gradido_blockchain_core/types/memo_key.h"
#include "gradido_blockchain_core/types/transaction.h"

namespace gradido::types {

    Napi::Value GrdtAddressToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one argument: number").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected first argument to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Number addressType = info[0].As<Napi::Number>();

        const char* enumString = grdt_address_to_string((grdt_address)addressType.Int32Value());
        return Napi::String::New(env, enumString);
    }

    Napi::Value GrdtBalanceDerivationToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one argument: number").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected first argument to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Number balanceDerivationType = info[0].As<Napi::Number>();

        const char* enumString = grdt_balance_derivation_to_string((grdt_balance_derivation)balanceDerivationType.Int32Value());
        return Napi::String::New(env, enumString);
    }

    Napi::Value GrdtCrossGroupToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one argument: number").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected first argument to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Number crossGroupType = info[0].As<Napi::Number>();

        const char* enumString = grdt_cross_group_to_string((grdt_cross_group)crossGroupType.Int32Value());
        return Napi::String::New(env, enumString);
    }

    Napi::Value GrdtLedgerAnchorToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one argument: number").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected first argument to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Number ledgerAnchorType = info[0].As<Napi::Number>();

        const char* enumString = grdt_ledger_anchor_to_string((grdt_ledger_anchor)ledgerAnchorType.Int32Value());
        return Napi::String::New(env, enumString);
    }

    Napi::Value GrdtMemoKeyToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one argument: number").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected first argument to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Number memoKeyType = info[0].As<Napi::Number>();

        const char* enumString = grdt_memo_key_to_string((grdt_memo_key)memoKeyType.Int32Value());
        return Napi::String::New(env, enumString);
    }

    Napi::Value GrdtTransactionToString(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (info.Length() != 1) {
            Napi::TypeError::New(env, "Expected one argument: number").ThrowAsJavaScriptException();
            return env.Null();
        }
        if (!info[0].IsNumber()) {
            Napi::TypeError::New(env, "Expected first argument to be a number").ThrowAsJavaScriptException();
            return env.Null();
        }

        Napi::Number transactionType = info[0].As<Napi::Number>();

        const char* enumString = grdt_transaction_to_string((grdt_transaction)transactionType.Int32Value());
        return Napi::String::New(env, enumString);
    }
} // namespace gradido::types
