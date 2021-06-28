#include "TestEd25519Bip32.h"
#include "ServerConfig.h"

#include "gradido_ed25519_bip32.h"

void TestEd25519Bip32::SetUp()
{
	for (int i = 0; i < 5; i++) {
		Poco::AutoPtr<Passphrase> passphrase = Passphrase::generate(&ServerConfig::g_Mnemonic_WordLists[2]);
		mED25519KeyPairs.push_back(KeyPairEd25519::create(passphrase));
	}
}

void TestEd25519Bip32::TearDown()
{
	for (auto it = mED25519KeyPairs.begin(); it != mED25519KeyPairs.end(); it++) {
		delete* it;
	}
	mED25519KeyPairs.clear();
}

TEST_F(TestEd25519Bip32, TestPrivateToPublic)
{
	auto mm = MemoryManager::getInstance();
	auto public_key_temp = mm->getFreeMemory(crypto_sign_PUBLICKEYBYTES);
	for (auto it = mED25519KeyPairs.begin(); it != mED25519KeyPairs.end(); it++) {

		EXPECT_TRUE(getPublicFromPrivateKey((*it)->getPrivKey()->data(), public_key_temp->data()));
		//const char* public_key = getPublicFromPrivateKey((const char*)(*it)->getPrivKey()->data());
		ASSERT_TRUE((*it)->isTheSame(*public_key_temp));
	}
}