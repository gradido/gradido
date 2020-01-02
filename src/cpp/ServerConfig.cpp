#include "ServerConfig.h"
#include "Crypto/mnemonic_german.h"
#include "Crypto/mnemonic_bip0039.h"
#include "Crypto/DRRandom.h"
#include "sodium.h"


#include "Poco/Net/SSLManager.h"
#include "Poco/Net/KeyConsoleHandler.h"
#include "Poco/Net/RejectCertificateHandler.h"
#include "Poco/SharedPtr.h"

#include "Poco/Mutex.h"
#include "Poco/Path.h"
#include "Poco/FileStream.h"
#include "Poco/LocalDateTime.h"
#include "Poco/DateTimeFormat.h"
#include "Poco/DateTimeFormatter.h"

using Poco::Net::SSLManager;
using Poco::Net::Context;
using Poco::Net::KeyConsoleHandler;
using Poco::Net::PrivateKeyPassphraseHandler;
using Poco::Net::InvalidCertificateHandler;
using Poco::Net::RejectCertificateHandler;
using Poco::SharedPtr;

namespace ServerConfig {

#define SESSION_TIMEOUT_DEFAULT 10

	Mnemonic g_Mnemonic_WordLists[MNEMONIC_MAX];
	ObfusArray* g_ServerCryptoKey = nullptr;
	ObfusArray* g_ServerKeySeed = nullptr;
//	std::string g_ServerAdminPublic;
	UniLib::controller::CPUSheduler* g_CPUScheduler = nullptr;
	UniLib::controller::CPUSheduler* g_CryptoCPUScheduler = nullptr;
	Context::Ptr g_SSL_CLient_Context = nullptr;
	EmailAccount g_EmailAccount;
	int g_SessionTimeout = SESSION_TIMEOUT_DEFAULT;
	std::string g_serverPath;
	Languages g_default_locale;
	std::string g_php_serverPath;
	std::string g_php_serverHost;
	Poco::Mutex g_TimeMutex;
	int         g_FakeLoginSleepTime = 820;
	std::string g_versionString = "";
	bool		g_disableEmail = false;

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
		NULLPAD_10;
		if (sodium_hex2bin(key, crypto_shorthash_KEYBYTES, serverKey.data(), serverKey.size(), nullptr, &realBinSize, nullptr)) {
			printf("[%s] serverKey isn't valid hex: %s\n", __FUNCTION__, serverKey.data());
			return false;
		}
		if (realBinSize != crypto_shorthash_KEYBYTES) {
			printf("[%s] serverKey hasn't valid size, expecting: %u, get: %lu\n",
				__FUNCTION__, crypto_shorthash_KEYBYTES, realBinSize);
			return false;
		}
		g_ServerCryptoKey = new ObfusArray(realBinSize, key);
		g_ServerKeySeed = new ObfusArray(9*8);
		Poco::Int64 i1 = randombytes_random();
		Poco::Int64 i2 = randombytes_random(); 
		g_ServerKeySeed->put(0, i1 | (i2 << 8));

		//g_ServerAdminPublic = cfg.getString("crypto.server_admin_public");

		DISASM_FALSERET;
		g_SessionTimeout = cfg.getInt("session.timeout", SESSION_TIMEOUT_DEFAULT);
		g_serverPath = cfg.getString("loginServer.path", "");
		g_default_locale = LanguageManager::languageFromString(cfg.getString("loginServer.default_locale"));
		g_php_serverPath = cfg.getString("phpServer.url", "");
		g_php_serverHost = cfg.getString("phpServer.host", "");
		//g_FakeLoginSleepTime = cfg.getInt("crypto.fake_login_sleep_time", g_FakeLoginSleepTime);
		return true;
	}

	bool initEMailAccount(const Poco::Util::LayeredConfiguration& cfg)
	{
		g_disableEmail = cfg.getBool("email.disable", false);
		g_EmailAccount.sender = cfg.getString("email.sender");
		g_EmailAccount.username = cfg.getString("email.username");
		g_EmailAccount.password = cfg.getString("email.password");
		g_EmailAccount.url = cfg.getString("email.smtp.url");
		g_EmailAccount.port = cfg.getInt("email.smtp.port");
		DISASM_FALSERET;
		//g_ServerKeySeed->put(3, DRRandom::r64());
		return true;
	}

	bool initSSLClientContext()
	{
		SharedPtr<InvalidCertificateHandler> pCert = new RejectCertificateHandler(false); // reject invalid certificates
		/*
		Context(Usage usage,
		const std::string& certificateNameOrPath,
		VerificationMode verMode = VERIFY_RELAXED,
		int options = OPT_DEFAULTS,
		const std::string& certificateStoreName = CERT_STORE_MY);
		*/
		try {
#ifdef POCO_NETSSL_WIN
		g_SSL_CLient_Context = new Context(Context::CLIENT_USE, "cacert.pem", Context::VERIFY_RELAXED, Context::OPT_DEFAULTS);
#else 
			
		g_SSL_CLient_Context = new Context(Context::CLIENT_USE, "", "", Poco::Path::config() + "grd_login/cacert.pem", Context::VERIFY_RELAXED, 9, true, "ALL:!ADH:!LOW:!EXP:!MD5:@STRENGTH");
#endif
		} catch(Poco::Exception& ex) {
			printf("[ServerConfig::initSSLClientContext] error init ssl context, maybe no cacert.pem found?\nPlease make sure you have cacert.pem (CA/root certificates) next to binary from https://curl.haxx.se/docs/caextract.html\n");
			return false;
		}
		DISASM_FALSERET;
		SSLManager::instance().initializeClient(0, pCert, g_SSL_CLient_Context);

		g_ServerKeySeed->put(5, DRRandom::r64());

		return true;
	}

	void unload() {
		if (g_ServerCryptoKey) {
			delete g_ServerCryptoKey;
		}
		if (g_ServerKeySeed) {
			delete g_ServerKeySeed;
		}
		if (g_CPUScheduler) {
			delete g_CPUScheduler;
		}

		if (g_CryptoCPUScheduler) {
			delete g_CryptoCPUScheduler;
		}
	}

	void writeToFile(std::istream& datas, std::string fileName)
	{
		static Poco::Mutex mutex;

		mutex.lock();

		Poco::FileOutputStream file(fileName, std::ios::out | std::ios::app);

		if (!file.good()) {
			printf("[ServerConfig::writeToFile] error creating file with name: %s\n", fileName.data());
			mutex.unlock();
			return;
		}

		Poco::LocalDateTime now;

		std::string dateTimeStr = Poco::DateTimeFormatter::format(now, Poco::DateTimeFormat::ISO8601_FORMAT);
		file << dateTimeStr << std::endl; 

		for (std::string line; std::getline(datas, line); ) {
			file << line << std::endl;
		}
		file << std::endl;
		file.close();
		mutex.unlock();
	}
}