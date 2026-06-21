#include "LedgerAnchor.h"
#include "napiUtils.h"

#include "gradido_blockchain_core/data/wire/ledger_anchor.h"
#include "gradido_blockchain_core/data/wire/hiero.h"
#include "gradido_blockchain_core/types/ledger_anchor.h"
#include "gradido_blockchain_core/utils/converter.h"

#include <cstddef>
#include <napi.h>

namespace gradido::data::wire {
    Napi::Object LedgerAnchor::Init(Napi::Env env, Napi::Object exports) {
        Napi::Function func = DefineClass(env, "LedgerAnchor", {
            InstanceMethod("getType", &LedgerAnchor::GetType),
            InstanceMethod("isLegacy", &LedgerAnchor::IsLegacy),
            InstanceMethod("isNodeTrigger", &LedgerAnchor::IsNodeTrigger),
            InstanceMethod("isHieroTransactionId", &LedgerAnchor::IsHieroTransactionId),
            InstanceMethod("getLegacyId", &LedgerAnchor::GetLegacyId),
            InstanceMethod("getNodeTriggerId", &LedgerAnchor::GetNodeTriggerId),
            InstanceMethod("getHieroTransactionId", &LedgerAnchor::GetHieroTransactionId),
            StaticMethod("createFromHieroTransactionId", &LedgerAnchor::CreateFromHieroTransactionId),
            // StaticMethod("Create", &LedgerAnchor::Create)
        });

        // https://github.com/nodejs/node-addon-api/blob/main/doc/object_wrap.md
        Napi::FunctionReference* constructor = new Napi::FunctionReference();
        *constructor = Napi::Persistent(func);

        exports.Set("LedgerAnchor", func);
        env.SetInstanceData<Napi::FunctionReference>(constructor);

        return exports;
    }

    Napi::Value LedgerAnchor::CreateCopy(const Napi::CallbackInfo& info, const grdw_ledger_anchor* ledger_anchor)
    {
        auto env = info.Env();
        Napi::FunctionReference* constructor = env.GetInstanceData<Napi::FunctionReference>();
        auto obj = constructor->New({});
        LedgerAnchor* wrapper = LedgerAnchor::Unwrap(obj);
        memcpy(&wrapper->mLedgerAnchor, ledger_anchor, sizeof(grdw_ledger_anchor));

        return obj;
    }

    Napi::Value LedgerAnchor::CreateFromHieroTransactionId(const Napi::CallbackInfo& info)
    {
      auto env = info.Env();
      if (info.Length() < 2 || !info[0].IsObject() || !info[1].IsObject()) {
          Napi::TypeError::New(
            info.Env(),
            "[LedgerAnchor.createFromHieroTransactionId] Expected two argument: transaction valid start timestamp {seconds:bigint, nanos?:number} and hiero account id { accountNum: bigint, shardNum?: bigint, realmNum?: bigint }"
          ).ThrowAsJavaScriptException();
          return env.Null();
      }
      auto transactionValidStartObj = info[0].As<Napi::Object>();
      grdd_timestamp transactionValidStart{};
      if (!getInt64FromObject(info, transactionValidStartObj, "seconds", transactionValidStart.seconds, true)) {
        Napi::TypeError::New(info.Env(), "[LedgerAnchor.createFromHieroTransactionId] Missing or invalid seconds: bigint in timestamp").ThrowAsJavaScriptException();
        return env.Null();
      }
      if (!getInt32FromObject(info, transactionValidStartObj, "nanos", transactionValidStart.nanos, false)) {
          return env.Null();
      }

      auto hieroAccountIdObj = info[1].As<Napi::Object>();
      grdw_hiero_account_id hieroAccountId{};
      if (!getInt64FromObject(info, hieroAccountIdObj, "accountNum", hieroAccountId.accountNum, true)) {
        Napi::TypeError::New(info.Env(), "[LedgerAnchor.createFromHieroTransactionId] Missing or invalid accountNum: bigint in account id").ThrowAsJavaScriptException();
        return env.Null();
      }
      if (!getInt64FromObject(info, hieroAccountIdObj, "shardNum", hieroAccountId.shardNum, false)) {
          return env.Null();
      }
      if (!getInt64FromObject(info, hieroAccountIdObj, "realmNum", hieroAccountId.realmNum, false)) {
          return env.Null();
      }

      Napi::FunctionReference* constructor = env.GetInstanceData<Napi::FunctionReference>();
      auto obj = constructor->New({});
      LedgerAnchor* wrapper = LedgerAnchor::Unwrap(obj);
      wrapper->mLedgerAnchor.type = GRDT_LEDGER_ANCHOR_HIERO_TRANSACTION_ID;
      wrapper->mLedgerAnchor.hiero_transaction_id.transactionValidStart = transactionValidStart;
      wrapper->mLedgerAnchor.hiero_transaction_id.accountID = hieroAccountId;

      return obj;
    }

    LedgerAnchor::LedgerAnchor(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<LedgerAnchor>(info)
    {
    }

    LedgerAnchor::~LedgerAnchor() {}

    Napi::Value LedgerAnchor::GetType(const Napi::CallbackInfo& info) {
        return Napi::String::New(info.Env(), grdt_ledger_anchor_to_string(grdw_ledger_anchor_get_type(&mLedgerAnchor)));
    }

    Napi::Value LedgerAnchor::IsLegacy(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), grdw_ledger_anchor_is_legacy(&mLedgerAnchor));
    }

    Napi::Value LedgerAnchor::IsNodeTrigger(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), grdw_ledger_anchor_is_node_trigger_transaction_id(&mLedgerAnchor));
    }

    Napi::Value LedgerAnchor::IsHieroTransactionId(const Napi::CallbackInfo& info) {
        return Napi::Boolean::New(info.Env(), grdw_ledger_anchor_is_hiero_transaction_id(&mLedgerAnchor));
    }

    Napi::Value LedgerAnchor::GetLegacyId(const Napi::CallbackInfo& info) {
        return Napi::BigInt::New(info.Env(), grdw_ledger_anchor_get_legacy_id(&mLedgerAnchor));
    }

    Napi::Value LedgerAnchor::GetNodeTriggerId(const Napi::CallbackInfo& info) {
        return Napi::BigInt::New(info.Env(), grdw_ledger_anchor_get_node_trigger_id(&mLedgerAnchor));
    }

    Napi::Value LedgerAnchor::GetHieroTransactionId(const Napi::CallbackInfo& info) {
        auto env = info.Env();
        grdw_hiero_transaction_id* hieroTransactionId = grdw_ledger_anchor_get_hiero_transaction_id(&mLedgerAnchor);
        if (!hieroTransactionId) {
            return env.Null();
        }
        char buffer[128];
        size_t written = grdw_hiero_transaction_id_to_string(buffer, 128, hieroTransactionId);
        if (written > 128) {
            std::string message = "[LedgerAnchor.getHieroTransactionId] Hiero Transaction Id String is to big, max expected: 128, actually: ";
            grdu_uint64_to_string(buffer, 128, written);
            message += buffer;
            Napi::Error::New(env, message.c_str()).ThrowAsJavaScriptException();
            return env.Null();
        }

        return Napi::String::New(env, buffer, written);
    }
}
