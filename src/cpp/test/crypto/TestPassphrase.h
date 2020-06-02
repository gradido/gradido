#ifndef __GRADIDO_LOGIN_SERVER_TEST_CRYPTO_TEST_PASSPHRASE_H
#define __GRADIDO_LOGIN_SERVER_TEST_CRYPTO_TEST_PASSPHRASE_H

#include "../Test.h"
#include "../../ServerConfig.h"
#include "gtest/gtest.h"

class TestPassphrase : public Test
{
public:
	TestPassphrase();
	~TestPassphrase();

	//! \return 0 if init okay, else return != 0
	int init();

	//! \return 0 if okay, else return != 0
	int test();
	const char* getName() { return "TestPassphrase"; }

protected:

};

class PassphraseTest : public ::testing::Test {
protected:
	void SetUp() override;

	struct PassphraseDataSet
	{
		PassphraseDataSet(std::string _passphrase, ServerConfig::Mnemonic_Types _type, std::string _pubkeyHex)
			: passphrase(_passphrase), mnemonicType(_type), pubkeyHex(_pubkeyHex) {}
	
		std::string passphrase;
		ServerConfig::Mnemonic_Types mnemonicType;
		std::string pubkeyHex;
	};

	std::vector<PassphraseDataSet> mPassphrasesForTesting;
	// void TearDown() override {}	
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_CRYPTO_TEST_PASSPHRASE_H