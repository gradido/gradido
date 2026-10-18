// AI-GENERATED — not an architecture reference
#include "Keys.h"

#include <sodium.h>

#include <cstring>

namespace gradido::crypto {

    Keys::Keys()
        : mPublicKey{}, mPrivateKey(nullptr)
    {
    }

    Keys::~Keys()
    {
        freePrivateKey();
    }

    bool Keys::samePublicKey(const Keys& other) const
    {
        return sodium_memcmp(mPublicKey, other.mPublicKey, PUBLIC_KEY_SIZE) == 0;
    }

    KeyResult Keys::set(const uint8_t* publicKey, const uint8_t* privateKey, PublicKeyFunction publicKeyOf)
    {
        freePrivateKey();
        memcpy(mPublicKey, publicKey, PUBLIC_KEY_SIZE);
        if (privateKey == nullptr) {
            return KeyResult::SUCCESS;
        }
        uint8_t derivedPublicKey[PUBLIC_KEY_SIZE];
        if (publicKeyOf(derivedPublicKey, privateKey) != 0
            || sodium_memcmp(derivedPublicKey, mPublicKey, PUBLIC_KEY_SIZE) != 0) {
            return KeyResult::PRIVATE_KEY_MISMATCH;
        }
        if (!allocatePrivateKey()) {
            return KeyResult::OUT_OF_MEMORY;
        }
        memcpy(mPrivateKey, privateKey, PRIVATE_KEY_SIZE);
        return KeyResult::SUCCESS;
    }

    KeyResult Keys::generate(const uint8_t* seed, RandomKeyPairFunction randomKeyPair, SeedKeyPairFunction seedKeyPair)
    {
        freePrivateKey();
        if (!allocatePrivateKey()) {
            return KeyResult::OUT_OF_MEMORY;
        }
        if (seed != nullptr) {
            seedKeyPair(mPublicKey, mPrivateKey, seed);
        } else {
            randomKeyPair(mPublicKey, mPrivateKey);
        }
        return KeyResult::SUCCESS;
    }

    bool Keys::allocatePrivateKey()
    {
        mPrivateKey = static_cast<uint8_t*>(sodium_malloc(PRIVATE_KEY_SIZE));
        return mPrivateKey != nullptr;
    }

    void Keys::freePrivateKey()
    {
        // sodium_free zeroes the memory before freeing it, and takes null
        sodium_free(mPrivateKey);
        mPrivateKey = nullptr;
    }

} // namespace gradido::crypto
