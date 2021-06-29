#include "TestEd25519Bip32.h"
#include "ServerConfig.h"
#include "lib/Profiler.h"

#include "gradido_ed25519_bip32.h"
#include "lib/DataTypeConverter.h"

void TestEd25519Bip32::SetUp()
{
	KeyPairEd25519* key_pair = nullptr;
	bool valid_key_pair = false;
	for (int i = 0; i < 100; i++) {
		do {
			Poco::AutoPtr<Passphrase> passphrase = Passphrase::generate(&ServerConfig::g_Mnemonic_WordLists[2]);
			key_pair = KeyPairEd25519::create(passphrase);
			valid_key_pair = is_3rd_highest_bit_clear(key_pair->getPrivKey()->data(), key_pair->getChainCode()->data());
		} while (!valid_key_pair);
		mED25519KeyPairs.push_back(key_pair);
		//auto privKey = DataTypeConverter::hexToBin(valid_private_keys[i]);
		//mED25519KeyPairs.push_back(new KeyPairEd25519(privKey));
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
	memset(*public_key_temp, 0, crypto_sign_PUBLICKEYBYTES);
	Profiler timeUsed;
	for (auto it = mED25519KeyPairs.begin(); it != mED25519KeyPairs.end(); it++) {
		EXPECT_TRUE(getPublicFromPrivateKey((*it)->getPrivKey()->data(), (*it)->getChainCode()->data(), public_key_temp->data()));
		ASSERT_TRUE((*it)->isTheSame(*public_key_temp));
	}
	printf("time for %d calls to getPublicFromPrivateKey in rust: %s\n", (uint32_t)mED25519KeyPairs.size(), timeUsed.string().data());
	mm->releaseMemory(public_key_temp);
}