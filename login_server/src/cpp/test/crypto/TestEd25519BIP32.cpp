#include "TestEd25519Bip32.h"
#include "ServerConfig.h"

#include "gradido_ed25519_bip32.h"

void TestEd25519Bip32::SetUp()
{
	for (int i = 0; i < 5; i++) {
		std::string passphrase_temp;
		Poco::AutoPtr<Passphrase> passphrase = new Passphrase(passphrase_temp, &ServerConfig::g_Mnemonic_WordLists[0]);
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

}