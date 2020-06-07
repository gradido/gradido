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
		PassphraseDataSet(std::string _passphrases[ServerConfig::MNEMONIC_MAX], ServerConfig::Mnemonic_Types _type, std::string _pubkeyHex, Poco::UInt16 _wordIndices[PHRASE_WORD_COUNT])
			: mnemonicType(_type), pubkeyHex(_pubkeyHex) {
			memcpy(wordIndices, _wordIndices, PHRASE_WORD_COUNT * sizeof(Poco::UInt16));
			for (int i = 0; i < ServerConfig::MNEMONIC_MAX; i++) {
				passphrases[i] = _passphrases[i];
			}
		}
	
		std::string passphrases[ServerConfig::MNEMONIC_MAX];
		ServerConfig::Mnemonic_Types mnemonicType;
		std::string pubkeyHex;
		Poco::UInt16 wordIndices[PHRASE_WORD_COUNT];
	};

	std::vector<PassphraseDataSet> mPassphrasesForTesting;
	// void TearDown() override {}	
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_CRYPTO_TEST_PASSPHRASE_H