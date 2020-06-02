#include "TestPassphrase.h"

#include "../../Crypto/Passphrase.h"
#include "../../SingletonManager/MemoryManager.h"

#include "sodium.h"

#include "gtest/gtest.h"



TestPassphrase::TestPassphrase()
{

}

TestPassphrase::~TestPassphrase()
{

}

int TestPassphrase::init()
{
	return 0;
}

//! \return 0 if okay, else return != 0
int TestPassphrase::test()
{
	return 0;
}

void PassphraseTest::SetUp()
{
	mPassphrasesForTesting.push_back(PassphraseDataSet(
		"beauty slight skill maze wrap neither table term pizza journey unusual fence mind buzz scrap height critic service table knock fury shrimp curious fog",
		ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER,
		"6fa7180b132e1248c649fc7b2e422ad57663299f85bd88b8b8031dce28b501a8"
		));
	mPassphrasesForTesting.push_back(PassphraseDataSet(
		"oftmals bist bietet spalten Datenbank Masse str&auml;flich hervor Derartig Hallo christlich Brief iPhone einpendeln telefonieren musizieren gigantisch Orchester zirkulieren essen gilt Erich Dollar money",
		ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER,
		"8943813a623863dd7c5e5b248e408ac8a8851ef758275b6043a06e9b5832c36c"
	));
	mPassphrasesForTesting.push_back(PassphraseDataSet(
		"tief Acker Abgaben jenseits Revolution verdeckt Entdeckung Sanktion sammeln Umdrehung regulieren murmeln Erkenntnis hart zwar zuspitzen indem fegen bomber zw&ouml;lf Mobbing divers Inspiration Krieg",
		ServerConfig::MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER,
		"d62f14173ae5d66b06753cc9d69d5471913ffc6053feedac2acf901eef3582a9"
	));

	ServerConfig::loadMnemonicWordLists();
}

TEST_F(PassphraseTest, detectMnemonic) {
	for (auto it = mPassphrasesForTesting.begin(); it != mPassphrasesForTesting.end(); it++) {
		auto testDataSet = *it;
		EXPECT_EQ(Passphrase::detectMnemonic(testDataSet.passphrase), &ServerConfig::g_Mnemonic_WordLists[testDataSet.mnemonicType]);
	}
	EXPECT_FALSE(Passphrase::detectMnemonic("Dies ist eine ungültige Passphrase"));
}

TEST_F(PassphraseTest, detectMnemonicWithPubkey) {
	auto mm = MemoryManager::getInstance();
	auto pubkeyBin = mm->getFreeMemory(crypto_sign_PUBLICKEYBYTES);
	for (auto it = mPassphrasesForTesting.begin(); it != mPassphrasesForTesting.end(); it++) {
		auto testDataSet = *it;
		//testDataSet.pubkeyHex
		ASSERT_FALSE(pubkeyBin->convertFromHex(testDataSet.pubkeyHex));
		EXPECT_EQ(Passphrase::detectMnemonic(testDataSet.passphrase, pubkeyBin), &ServerConfig::g_Mnemonic_WordLists[testDataSet.mnemonicType]);
	}
	mm->releaseMemory(pubkeyBin);
}

