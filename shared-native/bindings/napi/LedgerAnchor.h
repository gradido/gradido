#include <napi.h>
#include "gradido_blockchain_core/data/wire/ledger_anchor.h"

namespace gradido::data::wire {
    
    class LedgerAnchor : public Napi::ObjectWrap<LedgerAnchor> {
    public:
        static Napi::Object Init(Napi::Env env, Napi::Object exports);
        static Napi::Value CreateCopy(const Napi::CallbackInfo& info, const grdw_ledger_anchor* ledger_anchor);
        
        LedgerAnchor(const Napi::CallbackInfo& info); 
        ~LedgerAnchor();

    private:
        Napi::Value GetType(const Napi::CallbackInfo& info);
        Napi::Value IsLegacy(const Napi::CallbackInfo& info);
        Napi::Value IsNodeTrigger(const Napi::CallbackInfo& info);
        Napi::Value IsHieroTransactionId(const Napi::CallbackInfo& info);
        Napi::Value GetLegacyId(const Napi::CallbackInfo& info);
        Napi::Value GetNodeTriggerId(const Napi::CallbackInfo& info);
        Napi::Value GetHieroTransactionId(const Napi::CallbackInfo& info);
        
        // static Napi::FunctionReference constructor; 
        grdw_ledger_anchor mLedgerAnchor;
        
    };
}