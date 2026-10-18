#pragma once

#include "napiUtils.h"

#include "crypto/Keys.h"

#include <napi.h>

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace gradido::crypto {

    /**
     * What Ed25519KeyPair and X25519KeyPair share on the Node-API side: the exports, the
     * constructor and how a key pair is generated. The keys themselves are a member of the
     * subclass (Ed25519Keys, X25519Keys in src/crypto), reached through keys(), SetKeys() and
     * GenerateKeys(). A subclass derives from Napi::ObjectWrap<itself> and from this, and
     * registers InstanceMethods<itself>() beside its own methods.
     *
     * For the limit sodium_malloc puts on how many key pairs with private key can be alive at
     * once, see src/crypto/Keys.h.
     */
    class KeyPair {
    public:
        bool hasPrivateKey() const { return keys().hasPrivateKey(); }

        /**
         * Throws for every result but SUCCESS: a TypeError "[where] privateName does not belong
         * to publicName", or an Error for out of memory. False then.
         */
        static bool CheckKeyResult(Napi::Env env, KeyResult result, const char* where, const char* privateName, const char* publicName);

    protected:
        explicit KeyPair(const char* name);
        virtual ~KeyPair() = default;

        virtual const Keys& keys() const = 0;
        // privateKey may be null
        virtual KeyResult SetKeys(const uint8_t* publicKey, const uint8_t* privateKey) = 0;
        // seed may be null
        virtual KeyResult GenerateKeys(const uint8_t* seed) = 0;

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
        static Napi::Value Generate(const Napi::CallbackInfo& info, Napi::FunctionReference& constructor, size_t seedSize)
        {
            Napi::Env env = info.Env();
            Napi::Buffer<uint8_t> seed;
            bool hasSeed = info.Length() > 0 && !info[0].IsUndefined();
            if (hasSeed && !readBytes(env, info[0], (std::string(T::NAME) + ".generate").c_str(), "seed", seedSize, seed)) {
                return env.Null();
            }
            Napi::Object obj = constructor.New({Napi::External<char>::New(env, &GENERATE_TOKEN)});
            KeyPair* keyPair = T::Unwrap(obj);
            if (!CheckKeyResult(env, keyPair->GenerateKeys(hasSeed ? seed.Data() : nullptr), T::NAME, "privateKey", "publicKey")) {
                return env.Null();
            }
            return obj;
        }

        /**
         * The whole subclass constructor: reads (publicKey) or (publicKey, privateKey), 32 bytes
         * each, and hands them to SetKeys, which checks the private key against the public key.
         * Does nothing when Generate called it, which fills the keys itself. Wrong arguments
         * leave a TypeError pending.
         */
        void InitKeys(const Napi::CallbackInfo& info);

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

    private:
        // what Generate hands the constructor, wrapped in an External JavaScript cannot make
        static char GENERATE_TOKEN;

        // data as lowercase hex, with arnm_binary_to_hex; size at most Keys::PRIVATE_KEY_SIZE
        Napi::Value Hex(Napi::Env env, const uint8_t* data, size_t size) const;
    };

} // namespace gradido::crypto
