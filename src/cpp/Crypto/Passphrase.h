#ifndef __GRADIDO_LOGIN_SERVER_CRYPTO_PASSPHRASE_H
#define __GRADIDO_LOGIN_SERVER_CRYPTO_PASSPHRASE_H

//#include <string>
#include "mnemonic.h"
#include "../SingletonManager/MemoryManager.h"


#include "../lib/AutoPtrContainer.h"
#include "Poco/AutoPtr.h"

class Passphrase : public AutoPtrContainer
{
public:
	Passphrase(const std::string& passphrase, const Mnemonic* wordSource);

	static Poco::AutoPtr<Passphrase> create(const Poco::UInt16 wordIndices[PHRASE_WORD_COUNT], const Mnemonic* wordSource);
	static Poco::AutoPtr<Passphrase> create(const MemoryBin* wordIndices, const Mnemonic* wordSource);
	static const Mnemonic* detectMnemonic(const std::string& passphrase, const MemoryBin* publicKey = nullptr);

	//! \brief transform passphrase into another language/mnemonic source
	Poco::AutoPtr<Passphrase> transform(const Mnemonic* targetWordSource);

	//! \brief replace utf8 characters with html special character encoding
	//! 
	//! TODO: add more utf8 chars for other languages as they needed
	static std::string filter(const std::string& passphrase);
	
	bool checkIfValid();

	const Poco::UInt16* getWordIndices();

protected:
	//! \return true if ok
	bool createWordIndices();
	
	std::string			mPassphraseString;
	const Mnemonic*		mWordSource;
	Poco::UInt16		mWordIndices[PHRASE_WORD_COUNT];
};

#endif // __GRADIDO_LOGIN_SERVER_CRYPTO_PASSPHRASE

