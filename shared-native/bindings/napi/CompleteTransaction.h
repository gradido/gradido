#include <napi.h>
#include "gradido_blockchain_core/data/runtime/complete_transaction.h"

struct grdr_complete_transaction;

namespace gradido::data::runtime {
    
    class CompleteTransaction : public Napi::ObjectWrap<CompleteTransaction> {
    public:
        static Napi::Object Init(Napi::Env env, Napi::Object exports);
        
        CompleteTransaction(const Napi::CallbackInfo& info); 
        ~CompleteTransaction();

    private:
        Napi::Value InitFromProtobuf(const Napi::CallbackInfo& info);
        Napi::Value Validate(const Napi::CallbackInfo& info);
        Napi::Value GetSenderPublicKey(const Napi::CallbackInfo& info);
        Napi::Value GetRecipientPublicKey(const Napi::CallbackInfo& info);
        Napi::Value GetSenderCommunityUuid(const Napi::CallbackInfo& info);
        Napi::Value GetRecipientCommunityUuid(const Napi::CallbackInfo& info);
        Napi::Value GetRegisteredAccount(const Napi::CallbackInfo& info);
        Napi::Value GetAccountBalanceForPublicKey(const Napi::CallbackInfo& info);
        Napi::Value GetTransactionType(const Napi::CallbackInfo& info);
        Napi::Value GetTargetDate(const Napi::CallbackInfo& info);
        Napi::Value GetTimeoutDuration(const Napi::CallbackInfo& info);
        
        Napi::Value GetAmount(const Napi::CallbackInfo& info);
        
        grdr_complete_transaction m_tx;
    };
}