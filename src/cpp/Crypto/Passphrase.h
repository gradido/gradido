#ifndef __GRADIDO_LOGIN_SERVER_CRYPTO_PASSPHRASE_H
#define __GRADIDO_LOGIN_SERVER_CRYPTO_PASSPHRASE_H

//#include <string>
#include "mnemonic.h"
#include "../SingletonManager/MemoryManager.h"
#include "../lib/AutoPtrContainer.h"
#include "Poco/AutoPtr.h"

class KeyPairEd25519;

class Passphrase : public AutoPtrContainer
{
public:
	Passphrase(const std::string& passphrase, const Mnemonic* wordSource);

	static Poco::AutoPtr<Passphrase> create(const Poco::UInt16 wordIndices[PHRASE_WORD_COUNT], const Mnemonic* wordSource);
	static Poco::AutoPtr<Passphrase> create(const MemoryBin* wordIndices, const Mnemonic* wordSource);
	//! \brief generate new passphrase with random
	static Poco::AutoPtr<Passphrase> generate(const Mnemonic* wordSource);
	static const Mnemonic* detectMnemonic(const std::string& passphrase, const KeyPairEd25519* keyPair = nullptr);

	//! \brief transform passphrase into another language/mnemonic source
	//! \return this if targetWordSource is the same as mWordSource
	Poco::AutoPtr<Passphrase> transform(const Mnemonic* targetWordSource);

	//! \brief create clear passphrase from word indices from bitcoin word list (bip0039)
	//! 
	//! Used by hashing function to get really the same string,
	//! even user has typed in some not filtered character
	std::string createClearPassphrase() const;

	//! \brief replace utf8 characters with html special character encoding
	//! 
	//! TODO: add more utf8 chars for other languages as they needed
	static std::string filter(const std::string& passphrase);
	
	//! \return true if all words in passphrase existing in mWordSource
	bool checkIfValid();

	const Poco::UInt16* getWordIndices();
	const Poco::UInt16* getWordIndices() const;

	//! \return true if ok
	bool createWordIndices();

	//! \brief please handle with care! should be only seen by user and admin
	const std::string& getString() const { return mPassphraseString; }

protected:
	
	
	std::string			mPassphraseString;
	const Mnemonic*		mWordSource;
	Poco::UInt16		mWordIndices[PHRASE_WORD_COUNT];
};

#endif // __GRADIDO_LOGIN_SERVER_CRYPTO_PASSPHRASE

