#include <napi.h>

namespace gradido::data {
    namespace runtime {
        Napi::Value CompleteTransactionInit(const Napi::CallbackInfo& info);    
        Napi::Value CompleteTransactionFromProtobuf(const Napi::CallbackInfo& info);    
    }    
}