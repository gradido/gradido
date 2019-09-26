#include "Crypto/mnemonic.h"

namespace ServerConfig {

	enum Mnemonic_Types {
		MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER,
		MNEMONIC_BIP0039_SORTED_ORDER,
		MNEMONIC_MAX
	};

	extern Mnemonic g_Mnemonic_WordLists[MNEMONIC_MAX];

	void loadMnemonicWordLists();
}