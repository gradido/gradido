#include "Crypto/mnemonic.h"
#include "Crypto/Obfus_array.h"
#include "Poco/Util/LayeredConfiguration.h"

#include "tasks/CPUSheduler.h"

namespace ServerConfig {

	enum Mnemonic_Types {
		MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER,
		MNEMONIC_BIP0039_SORTED_ORDER,
		MNEMONIC_MAX
	};

	extern Mnemonic g_Mnemonic_WordLists[MNEMONIC_MAX];
	extern ObfusArray* g_ServerCryptoKey;
	extern UniLib::controller::CPUSheduler* g_CPUScheduler;

	bool loadMnemonicWordLists();
	bool initServerCrypto(const Poco::Util::LayeredConfiguration& cfg);

	void unload();
}