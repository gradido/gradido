// AI-GENERATED — not an architecture reference
#include "X25519KeyPair.h"
#include "AddonData.h"
#include "napiUtils.h"

#include <string>

namespace gradido::crypto {

    static_assert(crypto_box_PUBLICKEYBYTES == KeyPair::PUBLIC_KEY_SIZE, "X25519 public key fits KeyPair");

    namespace {
        constexpr size_t BOX_HEADER_SIZE = 1 + crypto_box_NONCEBYTES;
        constexpr size_t BOX_MIN_SIZE = BOX_HEADER_SIZE + crypto_box_MACBYTES;
        constexpr size_t SECRET_HEADER_SIZE = 1 + crypto_aead_xchacha20poly1305_ietf_NPUBBYTES;
        constexpr size_t SECRET_MIN_SIZE = SECRET_HEADER_SIZE + crypto_aead_xchacha20poly1305_ietf_ABYTES;

        // crypto_kdf takes exactly 8 bytes of context; changing it or the id changes every secret's key
        constexpr char SECRET_KDF_CONTEXT[crypto_kdf_CONTEXTBYTES + 1] = "GrdSecrt";
        constexpr uint64_t SECRET_KDF_SUBKEY_ID = 1;

        static_assert(crypto_box_SECRETKEYBYTES == crypto_kdf_KEYBYTES, "the private key is the kdf's master key");
        static_assert(crypto_aead_xchacha20poly1305_ietf_KEYBYTES >= crypto_kdf_BYTES_MIN
            && crypto_aead_xchacha20poly1305_ietf_KEYBYTES <= crypto_kdf_BYTES_MAX, "kdf can produce the aead key");

        // the checks every decrypt makes before touching the bytes: long enough, and of the expected format
        bool checkCiphertext(Napi::Env env, const Napi::Buffer<uint8_t>& box, size_t minSize, uint8_t format, Napi::Value& failure)
        {
            if (box.Length() < minSize) {
                failure = failureResult(
                    env, "MalformedCiphertext",
                    "ciphertext is " + std::to_string(box.Length()) + " bytes, at least " + std::to_string(minSize) + " expected"
                );
                return false;
            }
            if (box.Data()[0] != format) {
                failure = failureResult(
                    env, "UnknownVersion",
                    "ciphertext has format " + std::to_string(box.Data()[0]) + ", expected " + std::to_string(format)
                );
                return false;
            }
            return true;
        }
    } // namespace

    Napi::Object X25519KeyPair::Init(Napi::Env env, Napi::Object exports)
    {
        auto properties = KeyPair::InstanceMethods<X25519KeyPair>();
        properties.push_back(StaticMethod("generate", &X25519KeyPair::Generate));
        properties.push_back(InstanceMethod("encrypt", &X25519KeyPair::Encrypt));
        properties.push_back(InstanceMethod("decrypt", &X25519KeyPair::Decrypt));
        properties.push_back(InstanceMethod("encryptSecret", &X25519KeyPair::EncryptSecret));
        properties.push_back(InstanceMethod("decryptSecret", &X25519KeyPair::DecryptSecret));
        Napi::Function func = DefineClass(env, NAME, properties);
        env.GetInstanceData<AddonData>()->x25519KeyPair = Napi::Persistent(func);
        exports.Set(NAME, func);
        return exports;
    }

    Napi::Value X25519KeyPair::Generate(const Napi::CallbackInfo& info)
    {
        return KeyPair::Generate<X25519KeyPair>(
            info, info.Env().GetInstanceData<AddonData>()->x25519KeyPair,
            crypto_box_SEEDBYTES, crypto_box_keypair, crypto_box_seed_keypair
        );
    }

    X25519KeyPair::X25519KeyPair(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<X25519KeyPair>(info), KeyPair(NAME, crypto_box_SECRETKEYBYTES)
    {
        InitKeys(info, crypto_scalarmult_base);
    }

    X25519KeyPair* X25519KeyPair::UnwrapPublicOnlyPeer(const Napi::CallbackInfo& info, size_t index, const char* method, const char* name)
    {
        Napi::Env env = info.Env();
        Napi::FunctionReference& constructor = env.GetInstanceData<AddonData>()->x25519KeyPair;
        if (info.Length() <= index || !info[index].IsObject() || !info[index].As<Napi::Object>().InstanceOf(constructor.Value())) {
            Napi::TypeError::New(env, std::string("[X25519KeyPair.") + method + "] Expected " + name + " to be an X25519KeyPair")
                .ThrowAsJavaScriptException();
            return nullptr;
        }
        X25519KeyPair* peer = X25519KeyPair::Unwrap(info[index].As<Napi::Object>());
        if (peer->hasPrivateKey()) {
            Napi::TypeError::New(
                env,
                std::string("[X25519KeyPair.") + method + "] Expected " + name
                + " to carry only a public key; create it with new X25519KeyPair(publicKey)"
            ).ThrowAsJavaScriptException();
            return nullptr;
        }
        return peer;
    }

    void X25519KeyPair::DeriveSecretKey(uint8_t key[crypto_aead_xchacha20poly1305_ietf_KEYBYTES]) const
    {
        crypto_kdf_derive_from_key(key, crypto_aead_xchacha20poly1305_ietf_KEYBYTES, SECRET_KDF_SUBKEY_ID, SECRET_KDF_CONTEXT, mPrivateKey);
    }

    Napi::Value X25519KeyPair::Encrypt(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!RequirePrivateKey(info, "encrypt")) {
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[X25519KeyPair.encrypt] Expected payload to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> payload = info[0].As<Napi::Buffer<uint8_t>>();
        X25519KeyPair* recipient = UnwrapPublicOnlyPeer(info, 1, "encrypt", "recipient");
        if (recipient == nullptr) {
            return env.Null();
        }

        auto box = Napi::Buffer<uint8_t>::New(env, BOX_MIN_SIZE + payload.Length());
        uint8_t* nonce = box.Data() + 1;
        box.Data()[0] = FORMAT_BOX;
        randombytes_buf(nonce, crypto_box_NONCEBYTES);
        // fails only for a public key of low order, which no honest key pair has
        if (crypto_box_easy(box.Data() + BOX_HEADER_SIZE, payload.Data(), payload.Length(), nonce, recipient->mPublicKey, mPrivateKey) != 0) {
            Napi::Error::New(env, "[X25519KeyPair.encrypt] recipient's public key is unusable (a point of low order)").ThrowAsJavaScriptException();
            return env.Null();
        }
        return box;
    }

    Napi::Value X25519KeyPair::Decrypt(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!RequirePrivateKey(info, "decrypt")) {
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[X25519KeyPair.decrypt] Expected box to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> box = info[0].As<Napi::Buffer<uint8_t>>();
        X25519KeyPair* sender = UnwrapPublicOnlyPeer(info, 1, "decrypt", "sender");
        if (sender == nullptr) {
            return env.Null();
        }
        Napi::Value failure;
        if (!checkCiphertext(env, box, BOX_MIN_SIZE, FORMAT_BOX, failure)) {
            return failure;
        }

        auto payload = Napi::Buffer<uint8_t>::New(env, box.Length() - BOX_MIN_SIZE);
        const uint8_t* nonce = box.Data() + 1;
        if (crypto_box_open_easy(payload.Data(), box.Data() + BOX_HEADER_SIZE, box.Length() - BOX_HEADER_SIZE, nonce, sender->mPublicKey, mPrivateKey) != 0) {
            return failureResult(env, "DecryptFailed", "ciphertext was altered, or not encrypted by sender for this key pair");
        }
        return successResult(env, payload);
    }

    Napi::Value X25519KeyPair::EncryptSecret(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!RequirePrivateKey(info, "encryptSecret")) {
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[X25519KeyPair.encryptSecret] Expected payload to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> payload = info[0].As<Napi::Buffer<uint8_t>>();

        auto box = Napi::Buffer<uint8_t>::New(env, SECRET_MIN_SIZE + payload.Length());
        uint8_t* nonce = box.Data() + 1;
        box.Data()[0] = FORMAT_SECRET;
        randombytes_buf(nonce, crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);

        uint8_t key[crypto_aead_xchacha20poly1305_ietf_KEYBYTES];
        DeriveSecretKey(key);
        crypto_aead_xchacha20poly1305_ietf_encrypt(
            box.Data() + SECRET_HEADER_SIZE, nullptr,
            payload.Data(), payload.Length(),
            nullptr, 0,
            nullptr, nonce, key
        );
        sodium_memzero(key, sizeof(key));
        return box;
    }

    Napi::Value X25519KeyPair::DecryptSecret(const Napi::CallbackInfo& info)
    {
        Napi::Env env = info.Env();
        if (!RequirePrivateKey(info, "decryptSecret")) {
            return env.Null();
        }
        if (!info[0].IsBuffer()) {
            Napi::TypeError::New(env, "[X25519KeyPair.decryptSecret] Expected box to be a Uint8Array").ThrowAsJavaScriptException();
            return env.Null();
        }
        Napi::Buffer<uint8_t> box = info[0].As<Napi::Buffer<uint8_t>>();
        Napi::Value failure;
        if (!checkCiphertext(env, box, SECRET_MIN_SIZE, FORMAT_SECRET, failure)) {
            return failure;
        }

        auto payload = Napi::Buffer<uint8_t>::New(env, box.Length() - SECRET_MIN_SIZE);
        const uint8_t* nonce = box.Data() + 1;
        uint8_t key[crypto_aead_xchacha20poly1305_ietf_KEYBYTES];
        DeriveSecretKey(key);
        int result = crypto_aead_xchacha20poly1305_ietf_decrypt(
            payload.Data(), nullptr,
            nullptr,
            box.Data() + SECRET_HEADER_SIZE, box.Length() - SECRET_HEADER_SIZE,
            nullptr, 0,
            nonce, key
        );
        sodium_memzero(key, sizeof(key));
        if (result != 0) {
            return failureResult(env, "DecryptFailed", "ciphertext was altered, or not encrypted by this key pair");
        }
        return successResult(env, payload);
    }

} // namespace gradido::crypto
