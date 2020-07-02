#ifndef __GRADIDO_LOGIN_SERVER_IMPORTANT_TESTS_H
#define __GRADIDO_LOGIN_SERVER_IMPORTANT_TESTS_H

#include <string>
#include "Crypto/mnemonic.h"

namespace ImportantTests {
	bool validateKeyPairED25519(const std::string& passphrase, const Mnemonic* wordSource, const std::string& public_key_hex);
	bool passphraseGenerationAndTransformation();
};

#endif //__GRADIDO_LOGIN_SERVER_IMPORTANT_TESTS_H