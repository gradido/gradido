#pragma once

#include "napiUtils.h"

#include <napi.h>

#include <sodium.h>

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace gradido::crypto {

    /**
     * What Ed25519KeyPair and X25519KeyPair share: the public key, the private key in
     * sodium_malloc'd memory (null when there is none), the exports, and how a key pair is
     * generated. A subclass derives from Napi::ObjectWrap<itself> and from this, and registers
     * InstanceMethods<itself>() beside its own methods.
     *
     * Limit: sodium_malloc puts every private key on pages of its own, between guard pages --
     * 4 kernel memory mappings per key (measured on Linux). A process has vm.max_map_count of
     * them, 65530 by default, shared with V8 and everything else, so at most about 16000 key
     * pairs with private key can be alive at once. Past that every mmap fails and the process
     * dies out of memory. The memory comes back only when the finalizer runs, after a GC and
     * asynchronously, so a synchronous loop that creates them piles them up even when none
     * stays reachable. Fine for the few long-lived ones (the home community's keys); not for
     * one per user in a loop. Key pairs with only a public key take no such memory.
     */
    class KeyPair {
    public:
        static constexpr size_t PUBLIC_KEY_SIZE = 32;

        bool hasPrivateKey() const { return mPrivateKey != nullptr; }

    protected:
        using RandomKeyPairFunction = int (*)(uint8_t* publicKey, uint8_t* privateKey);
        using SeedKeyPairFunction = int (*)(uint8_t* publicKey, uint8_t* privateKey, const uint8_t* seed);
        // the public key belonging to a private key; non-zero for a private key that has none
        using PublicKeyFunction = int (*)(uint8_t* publicKey, const uint8_t* privateKey);

        KeyPair(const char* name, size_t privateKeySize);
        ~KeyPair();

        // the JavaScript methods every key pair has
        template <typename T>
        static std::vector<Napi::ClassPropertyDescriptor<T>> InstanceMethods()
        {
            return {
                Napi::ObjectWrap<T>::InstanceMethod("hasPrivateKey", &T::HasPrivateKey),
                Napi::ObjectWrap<T>::InstanceMethod("toBuffer", &T::ToBuffer),
                Napi::ObjectWrap<T>::InstanceMethod("toHex", &T::ToHex),
                Napi::ObjectWrap<T>::InstanceMethod("publicKeyToBuffer", &T::PublicKeyToBuffer),
                Napi::ObjectWrap<T>::InstanceMethod("publicKeyToHex", &T::PublicKeyToHex),
                Napi::ObjectWrap<T>::InstanceMethod("privateKeyToBuffer", &T::PrivateKeyToBuffer),
                Napi::ObjectWrap<T>::InstanceMethod("privateKeyToHex", &T::PrivateKeyToHex),
            };
        }

        /**
         * The static generate(seed?) of a subclass: random without a seed, else from a seed of
         * `seedSize` bytes. The keys are written straight into the new instance, so the private
         * key never sits anywhere else.
         */
        template <typename T>
        static Napi::Value Generate(
            const Napi::CallbackInfo& info,
            Napi::FunctionReference& constructor,
            size_t seedSize,
            RandomKeyPairFunction randomKeyPair,
            SeedKeyPairFunction seedKeyPair
        ) {
            Napi::Env env = info.Env();
            Napi::Buffer<uint8_t> seed;
            bool hasSeed = info.Length() > 0 && !info[0].IsUndefined();
            if (hasSeed && !readBytes(env, info[0], (std::string(T::NAME) + ".generate").c_str(), "seed", seedSize, seed)) {
                return env.Null();
            }
            Napi::Object obj = constructor.New({Napi::External<char>::New(env, &GENERATE_TOKEN)});
            KeyPair* keyPair = T::Unwrap(obj);
            if (!keyPair->AllocatePrivateKey(env)) {
                return env.Null();
            }
            if (hasSeed) {
                seedKeyPair(keyPair->mPublicKey, keyPair->mPrivateKey, seed.Data());
            } else {
                randomKeyPair(keyPair->mPublicKey, keyPair->mPrivateKey);
            }
            return obj;
        }

        /**
         * The whole subclass constructor: reads (publicKey) or (publicKey, privateKey), checks
         * the private key against the public key with `publicKeyOf` and keeps it. Does nothing
         * when Generate called it, which fills the keys itself. Wrong arguments leave a
         * TypeError pending.
         */
        void InitKeys(const Napi::CallbackInfo& info, PublicKeyFunction publicKeyOf);

        // false with an Error pending when sodium_malloc has nothing to give
        bool AllocatePrivateKey(Napi::Env env);
        // zeroes and frees the private key; the pair has only its public key after it
        void FreePrivateKey();

        // throws a TypeError naming `method` and returns false unless this pair has a private key
        bool RequirePrivateKey(const Napi::CallbackInfo& info, const char* method) const;

        Napi::Value HasPrivateKey(const Napi::CallbackInfo& info);
        Napi::Value ToBuffer(const Napi::CallbackInfo& info);
        Napi::Value ToHex(const Napi::CallbackInfo& info);
        Napi::Value PublicKeyToBuffer(const Napi::CallbackInfo& info);
        Napi::Value PublicKeyToHex(const Napi::CallbackInfo& info);
        Napi::Value PrivateKeyToBuffer(const Napi::CallbackInfo& info);
        Napi::Value PrivateKeyToHex(const Napi::CallbackInfo& info);

        const char* mName;
        const size_t mPrivateKeySize;
        uint8_t mPublicKey[PUBLIC_KEY_SIZE];
        // null without private key, else mPrivateKeySize bytes from sodium_malloc
        uint8_t* mPrivateKey;

    private:
        // what Generate hands the constructor, wrapped in an External JavaScript cannot make
        static char GENERATE_TOKEN;

        // data as lowercase hex, with arnm_binary_to_hex; size at most the largest private key
        Napi::Value Hex(Napi::Env env, const uint8_t* data, size_t size) const;
    };

} // namespace gradido::crypto
