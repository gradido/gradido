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
#include "../lib/DataTypeConverter.h"

class KeyPairHedera : public IKeyPair
{
public:
	//! \param privateKey: copy
	//! \param publicKey: copy
	//! 
	KeyPairHedera(const unsigned char* privateKey, size_t privateKeySize, const unsigned char* publicKey = nullptr, size_t publicKeySize = 0);
	KeyPairHedera(const MemoryBin* privateKey, const MemoryBin* publicKey = nullptr);
	KeyPairHedera(const std::vector<unsigned char>& privateKey, const unsigned char* publicKey = nullptr, size_t publicKeySize = 0);
	

	static KeyPairHedera* create();

	~KeyPairHedera();


	//! \return caller take ownership of return value
	MemoryBin* sign(const MemoryBin* message) const { return sign(message->data(), message->size()); }
	inline MemoryBin* sign(const std::string& bodyBytes) const { return sign((const unsigned char*)bodyBytes.data(), bodyBytes.size()); }
	MemoryBin* sign(const unsigned char* message, size_t messageSize) const;

	bool verify(const unsigned char* message, size_t messageSize, MemoryBin* signature) const;

	inline const unsigned char* getPublicKey() const { return mPublicKey; }
	MemoryBin* getPublicKeyCopy() const;
	inline std::string getPublicKeyHex() const { return DataTypeConverter::binToHex(mPublicKey, getPublicKeySize()); }
	const static size_t getPublicKeySize() {return crypto_sign_PUBLICKEYBYTES;}

	inline bool isTheSame(const KeyPairHedera& b) const {
		return 0 == sodium_memcmp(mPublicKey, b.mPublicKey, getPublicKeySize());
	}
	inline bool isTheSame(const unsigned char* pubkey) const {
		if (!pubkey)
			return false;
		return 0 == sodium_memcmp(mPublicKey, pubkey, getPublicKeySize());
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

	//! \brief 
	MemoryBin* getCryptedPrivKey(const Poco::AutoPtr<SecretKeyCryptography> password) const;
	MemoryBin* getPrivateKeyCopy() const;
	inline std::string getPrivateKeyHex(const Poco::AutoPtr<SecretKeyCryptography> password) const { if (!mPrivateKey) return "0x0"; return DataTypeConverter::binToHex(mPrivateKey); }

protected:

	KeyPairHedera();
	void createKeyFromSeed(const unsigned char* seed, size_t seedSize);


private:
	// 64 Byte
	//! \brief ed25519 libsodium private key
	//! 
	//! TODO: replace MemoryBin by a memory obfuscation class which make it hard to steal the private key from memory
	MemoryBin* mPrivateKey;

	// 32 Byte
	//! \brief ed25519 libsodium public key
	unsigned char mPublicKey[crypto_sign_PUBLICKEYBYTES];
};

#endif //__GRADIDO_LOGIN_SERVER_CRYPTO_HEDERA_KEYS_H