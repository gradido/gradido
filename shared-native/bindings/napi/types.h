#include <napi.h>

namespace gradido::types {
    Napi::Value GrdtAddressToString(const Napi::CallbackInfo& info);
    Napi::Value GrdtBalanceDerivationToString(const Napi::CallbackInfo& info);
    Napi::Value GrdtCrossGroupToString(const Napi::CallbackInfo& info);
    Napi::Value GrdtLedgerAnchorToString(const Napi::CallbackInfo& info);
    Napi::Value GrdtMemoKeyToString(const Napi::CallbackInfo& info);
    Napi::Value GrdtTransactionToString(const Napi::CallbackInfo& info);
} // namespace gradido::types
