// AI-GENERATED — not an architecture reference
#pragma once

#include <napi.h>

#include "passwordHashing.h"

#include <memory>

namespace gradido {

    /**
     * The password side of what the process is configured with once, at start, and never
     * changes while it runs: the app secret and the server key every password and PIN
     * derivation is keyed with, and the threads that do the password derivations. The
     * TypeScript AppContext (shared) holds the one instance; see index.d.ts for the API as
     * JavaScript sees it.
     */
    class PasswordContext : public Napi::ObjectWrap<PasswordContext> {
    public:
        static Napi::Object Init(Napi::Env env, Napi::Object exports);

        PasswordContext(const Napi::CallbackInfo& info);
        ~PasswordContext();

    private:
        Napi::Value HashPassword(const Napi::CallbackInfo& info);
        Napi::Value DerivePinKey(const Napi::CallbackInfo& info);
        Napi::Value GetPasswordHashingStats(const Napi::CallbackInfo& info);
        Napi::Value Destroy(const Napi::CallbackInfo& info);

        password::Secrets mSecrets;
        std::unique_ptr<password::HashingPool> mPasswordHashing;
    };

} // namespace gradido
