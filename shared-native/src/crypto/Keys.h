// AI-GENERATED — not an architecture reference
#pragma once

#include <cstddef>
#include <cstdint>

namespace gradido::crypto {

    enum class KeyResult {
        SUCCESS,
        // the private key does not belong to the public key
        PRIVATE_KEY_MISMATCH,
        // sodium_malloc had nothing to give
        OUT_OF_MEMORY,
    };

    /**
     * What Ed25519Keys and X25519Keys share, free of Node-API: the public key, and the private
     * key in sodium_malloc'd memory (null when there is none). Both private keys are 32 bytes:
     * the Ed25519 one is the seed, the X25519 one the scalar.
     *
     * Not copyable and not movable, the private key has one owner. It lives where its owner
     * lives: a member of a Napi::ObjectWrap (Ed25519KeyPair, X25519KeyPair, HomeCommunityNative).
     *
     * Limit: sodium_malloc puts every private key on pages of its own, between guard pages --
     * 4 kernel memory mappings per key (measured on Linux). A process has vm.max_map_count of
     * them, 65530 by default, shared with V8 and everything else, so at most about 16000 keys
     * with private key can be alive at once. Past that every mmap fails and the process dies out
     * of memory. When an owner is a JavaScript object, the memory comes back only when its
     * finalizer runs, after a GC and asynchronously, so a synchronous loop that creates them
     * piles them up even when none stays reachable. Fine for the few long-lived ones (the home
     * community's keys); not for one per user in a loop. Keys with only a public key take no
     * such memory.
     */
    class Keys {
    public:
        static constexpr size_t PUBLIC_KEY_SIZE = 32;
        static constexpr size_t PRIVATE_KEY_SIZE = 32;

        Keys(const Keys&) = delete;
        Keys& operator=(const Keys&) = delete;

        bool hasPrivateKey() const { return mPrivateKey != nullptr; }
        const uint8_t* publicKey() const { return mPublicKey; }
        // null without private key
        const uint8_t* privateKey() const { return mPrivateKey; }
        // the same public key; whether either holds the private key does not matter, a private
        // key held always belongs to its public key
        bool samePublicKey(const Keys& other) const;

    protected:
        // the public key belonging to a private key; non-zero for a private key that has none
        using PublicKeyFunction = int (*)(uint8_t* publicKey, const uint8_t* privateKey);
        using RandomKeyPairFunction = int (*)(uint8_t* publicKey, uint8_t* privateKey);
        using SeedKeyPairFunction = int (*)(uint8_t* publicKey, uint8_t* privateKey, const uint8_t* seed);

        // only a public key of zeros until set or generated
        Keys();
        ~Keys();

        // Takes the public key, and the private key unless it is null, after checking it with
        // publicKeyOf. Whatever was held before is dropped first, also when this fails.
        KeyResult set(const uint8_t* publicKey, const uint8_t* privateKey, PublicKeyFunction publicKeyOf);
        // Random without a seed (null), else from the seed. The keys are written straight into
        // the private key memory, so the private key never sits anywhere else.
        KeyResult generate(const uint8_t* seed, RandomKeyPairFunction randomKeyPair, SeedKeyPairFunction seedKeyPair);

        uint8_t mPublicKey[PUBLIC_KEY_SIZE];
        uint8_t* mPrivateKey;

    private:
        bool allocatePrivateKey();
        // zeroes and frees the private key; only the public key is left
        void freePrivateKey();
    };

} // namespace gradido::crypto
