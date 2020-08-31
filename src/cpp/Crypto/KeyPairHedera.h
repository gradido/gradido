#ifndef __GRADIDO_LOGIN_SERVER_CRYPTO_HEDERA_KEYS_H
#define __GRADIDO_LOGIN_SERVER_CRYPTO_HEDERA_KEYS_H

#include "IKeyPair.h"

/*!
* \author: Dario Rekowski
*
* \date: 2020-08-28
*
* \brief: Key Pairs class for ed25519 keys, used by hedera for transaction sign
*/


#include "sodium.h"
#include "SecretKeyCryptography.h"
#include "iroha-ed25519/include/ed25519/ed25519.h"

class KeyPairHedera : public IKeyPair
{
public:
	//! \param privateKey: copy
	//! \param publicKey: copy
	//! 
	KeyPairHedera(const MemoryBin* privateKey, const unsigned char* publicKey = nullptr, size_t publicKeySize = 0);
	KeyPairHedera(const MemoryBin* privateKey, const MemoryBin* publicKey = nullptr);

	~KeyPairHedera();


	//! \return caller take ownership of return value
	MemoryBin* sign(const MemoryBin* message) const { return sign(message->data(), message->size()); }
	inline MemoryBin* sign(const std::string& bodyBytes) const { return sign((const unsigned char*)bodyBytes.data(), bodyBytes.size()); }
	MemoryBin* sign(const unsigned char* message, size_t messageSize) const;

	bool verify(const unsigned char* message, size_t messageSize, MemoryBin* signature) const;

	inline const unsigned char* getPublicKey() const { return mPublicKey; }
	MemoryBin* getPublicKeyCopy() const;

	inline bool isTheSame(const KeyPairHedera& b) const {
		return 0 == sodium_memcmp(mPublicKey, b.mPublicKey, ed25519_pubkey_SIZE);
	}
	inline bool isTheSame(const unsigned char* pubkey) const {
		if (!pubkey)
			return false;
		return 0 == sodium_memcmp(mPublicKey, pubkey, ed25519_pubkey_SIZE);
	}
	//! \return 0 if the same
	//! \return -1 if not the same
	//! \return 1 if hasn't private key
	inline int isTheSame(const MemoryBin* privkey) const {
		if (!mPrivateKey) return 1;
		if (privkey->size() != mPrivateKey->size()) return -1;
		return sodium_memcmp(*mPrivateKey, *privkey, privkey->size());
	}

	inline bool operator == (const KeyPairHedera& b) const { return isTheSame(b); }
	inline bool operator != (const KeyPairHedera& b) const { return !isTheSame(b); }

	inline bool operator == (const unsigned char* b) const { return isTheSame(b); }
	inline bool operator != (const unsigned char* b) const { return !isTheSame(b); }

	inline bool hasPrivateKey() const { return mPrivateKey != nullptr; }

	//! \brief only way to get a private key.. encrypted
	MemoryBin* getCryptedPrivKey(const Poco::AutoPtr<SecretKeyCryptography> password) const;

protected:

	KeyPairHedera();
	void createKeyFromSeed(const MemoryBin* seed);


private:
	// 64 Byte
	//! \brief ed25519 libsodium private key
	//! 
	//! TODO: replace MemoryBin by a memory obfuscation class which make it hard to steal the private key from memory
	MemoryBin* mPrivateKey;

	// 32 Byte
	//! \brief ed25519 libsodium public key
	unsigned char mPublicKey[ed25519_pubkey_SIZE];
};

#endif //__GRADIDO_LOGIN_SERVER_CRYPTO_HEDERA_KEYS_H