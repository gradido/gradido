// AI-GENERATED — not an architecture reference
#pragma once

#include <napi.h>

#include "passwordHashing.h"

#include <memory>

namespace gradido {

    /**
     * What the process is configured with once, at start, and never changes while it runs:
     * the app secret and the server key every password and PIN derivation is keyed with, and
     * the threads that do the password derivations. The TypeScript AppContext (shared) holds
     * the one instance; see index.d.ts for the API as JavaScript sees it.
     */
    class AppContext : public Napi::ObjectWrap<AppContext> {
    public:
        static Napi::Object Init(Napi::Env env, Napi::Object exports);

        AppContext(const Napi::CallbackInfo& info);
        ~AppContext();

    private:
        Napi::Value HashPassword(const Napi::CallbackInfo& info);
        Napi::Value DerivePinKey(const Napi::CallbackInfo& info);
        Napi::Value GetPasswordHashingLimits(const Napi::CallbackInfo& info);
        Napi::Value Destroy(const Napi::CallbackInfo& info);

        password::Secrets mSecrets;
        std::unique_ptr<password::HashingPool> mPasswordHashing;
    };

} // namespace gradido
