#ifndef __GRADIDO_LOGIN_SERVER_TEST_CRYPTO_TEST_ED25519_BIP32_H
#define __GRADIDO_LOGIN_SERVER_TEST_CRYPTO_TEST_ED25519_BIP32_H

#include "gtest/gtest.h"
#include "Crypto/KeyPairEd25519.h"
#include <list>

class TestEd25519Bip32 : public ::testing::Test
{
protected:
	void SetUp() override;
	void TearDown() override;

	std::list<KeyPairEd25519*> mED25519KeyPairs; 
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_CRYPTO_TEST_ED25519_BIP32_H