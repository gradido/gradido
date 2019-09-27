#include "ServerConfig.h"
#include "Crypto/mnemonic_german.h"
#include "Crypto/mnemonic_bip0039.h"
#include "sodium.h"

namespace ServerConfig {
	Mnemonic g_Mnemonic_WordLists[MNEMONIC_MAX];
	ObfusArray* g_ServerCryptoKey = nullptr;
	UniLib::controller::CPUSheduler* g_CPUScheduler = nullptr;

	bool loadMnemonicWordLists()
	{
		for (int i = 0; i < MNEMONIC_MAX; i++) {
			int iResult = 0;
			switch (i) {
			case MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER:
				iResult = g_Mnemonic_WordLists[i].init(populate_mnemonic_german, g_mnemonic_german_original_size, g_mnemonic_german_compressed_size);
				if (iResult) {
					printf("[%s] error init german mnemonic set, error nr: %d\n", __FUNCTION__, iResult);
					return false;
				}
				break;
			case MNEMONIC_BIP0039_SORTED_ORDER:
				iResult = g_Mnemonic_WordLists[i].init(populate_mnemonic_bip0039, g_mnemonic_bip0039_original_size, g_mnemonic_bip0039_compressed_size);
				if (iResult) {
					printf("[%s] error init bip0039 mnemonic set, error nr: %d\n", __FUNCTION__, iResult);
					return false;
				}
				break;
			default: printf("[%s] unknown MnemonicType\n", __FUNCTION__); return false;
			}
		}
		return true;
	}

	bool initServerCrypto(const Poco::Util::LayeredConfiguration& cfg)
	{
		auto serverKey = cfg.getString("crypto.server_key");
		unsigned char key[crypto_shorthash_KEYBYTES];
		size_t realBinSize = 0;
		if (sodium_hex2bin(key, crypto_shorthash_KEYBYTES, serverKey.data(), serverKey.size(), nullptr, &realBinSize, nullptr)) {
			printf("[%s] serverKey isn't valid hex: %s\n", __FUNCTION__, serverKey.data());
			return false;
		}
		if (realBinSize != crypto_shorthash_KEYBYTES) {
			printf("[%s] serverKey hasn't valid size, expecting: %d, get: %d\n",
				__FUNCTION__, crypto_shorthash_KEYBYTES, realBinSize);
			return false;
		}
		g_ServerCryptoKey = new ObfusArray(realBinSize, key);
		return true;
	}

	void unload() {
		if (g_ServerCryptoKey) {
			delete g_ServerCryptoKey;
		}
		if (g_CPUScheduler) {
			delete g_CPUScheduler;
		}
	}
}