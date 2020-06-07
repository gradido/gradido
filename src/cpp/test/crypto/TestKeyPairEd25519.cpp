#include "TestPassphrase.h"

#include "../../Crypto/KeyPair.h"
#include "../../Crypto/KeyPairEd25519.h"
#include "../../Crypto/Passphrase.h"
#include "../../lib/DataTypeConverter.h"

TEST_F(PassphraseTest, TestEd25519KeyPair) {
	for (auto it = mPassphrasesForTesting.begin(); it != mPassphrasesForTesting.end(); it++) {
		auto test_data_set = *it;
		auto mnemonic = &ServerConfig::g_Mnemonic_WordLists[test_data_set.mnemonicType];
		auto tr = Passphrase::create(test_data_set.wordIndices, mnemonic);

		auto word_indices = tr->getWordIndices();

		auto key_pair_ed25519 = KeyPairEd25519::create(tr);
		KeyPair key_pair;
		key_pair.generateFromPassphrase(test_data_set.passphrases[test_data_set.mnemonicType].data(), mnemonic);
		
		EXPECT_EQ(key_pair.getPubkeyHex(), test_data_set.pubkeyHex);
		EXPECT_EQ(DataTypeConverter::pubkeyToHex(key_pair_ed25519->getPublicKey()), key_pair.getPubkeyHex());

		//auto key_pair_old 
		delete key_pair_ed25519;
	}
}

