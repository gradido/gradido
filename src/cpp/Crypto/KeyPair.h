#ifndef GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR
#define GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR

#include "Obfus_array.h"
#include "../SingletonManager/MemoryManager.h"
#include "mnemonic.h"

#include "ed25519/ed25519.h"
#include <sodium.h>

class UserWriteKeysIntoDB;
class UserGenerateKeys;
class DebugPassphrasePage;
class User;
class RepairDefectPassphrase;

// TODO: https://libsodium.gitbook.io/doc/advanced/ed25519-curve25519
class KeyPair 
{
	friend UserWriteKeysIntoDB;
	friend UserGenerateKeys;
	friend DebugPassphrasePage;
	friend User;
	friend RepairDefectPassphrase;
public:
	KeyPair();
	~KeyPair();

	bool generateFromPassphrase(const char* passphrase, const Mnemonic* word_source);
	bool generateFromPassphrase(const std::string& passphrase);
	static std::string passphraseTransform(const std::string& passphrase, const Mnemonic* currentWordSource, const Mnemonic* targetWordSource);
	static std::string filterPassphrase(const std::string& passphrase);
	static bool validatePassphrase(const std::string& passphrase, Mnemonic** wordSource = nullptr);
	
	std::string getPubkeyHex();
	bool savePrivKey(int userId);
	static std::string getHex(const unsigned char* data, Poco::UInt32 size);
	static std::string getHex(const MemoryBin* data);
	
	inline const unsigned char* getPublicKey() const { return mSodiumPublic; }

	bool isPubkeysTheSame(const unsigned char* pubkey) const;

protected:
	const MemoryBin* getPrivateKey() const { return mSodiumSecret; }

	static MemoryBin* createWordIndices(const std::string& passphrase, const Mnemonic* word_source);
	static std::string createClearPassphraseFromWordIndices(MemoryBin* word_indices, const Mnemonic* word_source);
	

private:
	// 32 Byte
	//! \brief ed25519 ref10 private key
	MemoryBin* mPrivateKey;

	// 64 Byte
	//! \brief ed25519 libsodium private key
	MemoryBin* mSodiumSecret;

	// 32 Byte
	//! \brief ed25519 ref10 public key
	unsigned char mPublicKey[ed25519_pubkey_SIZE];

	// 32 Byte
	//! \brief ed25519 libsodium public key
	unsigned char mSodiumPublic[crypto_sign_PUBLICKEYBYTES];
};

#endif //GRADIDO_LOGIN_SERVER_CRYPTO_KEY_PAIR