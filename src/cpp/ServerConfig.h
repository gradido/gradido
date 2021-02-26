#ifndef __GRADIDO_LOGIN_SERVER_SERVER_CONFIG__
#define __GRADIDO_LOGIN_SERVER_SERVER_CONFIG__

#include "Crypto/mnemonic.h"
#include "Crypto/Obfus_array.h"
#include "Poco/Util/LayeredConfiguration.h"
#include "Poco/Net/Context.h"
#include "Poco/Types.h"
#include "Poco/Util/Timer.h"

#include "tasks/CPUSheduler.h"

#include "SingletonManager/LanguageManager.h"
#include "SingletonManager/MemoryManager.h"

#define DISABLE_EMAIL

namespace ServerConfig {

	enum Mnemonic_Types {
		MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER,
		MNEMONIC_GRADIDO_BOOK_GERMAN_RANDOM_ORDER_FIXED_CASES,
		MNEMONIC_BIP0039_SORTED_ORDER,
		MNEMONIC_MAX
	};
	// depracted, moved to email manager
	struct EmailAccount {
		std::string sender;
		std::string admin_receiver;
		std::string username;
		std::string password;
		std::string url;
		int port;
	};

	enum ServerSetupType {
		SERVER_TYPE_TEST,
		SERVER_TYPE_STAGING,
		SERVER_TYPE_PRODUCTION
	};

	// used with bit-operators, so only use numbers with control exactly one bit (1,2,4,8,16...)
	enum AllowUnsecure {
		NOT_UNSECURE = 0,
		UNSECURE_PASSWORD_REQUESTS = 1,
		UNSECURE_AUTO_SIGN_TRANSACTIONS = 2,
		UNSECURE_CORS_ALL = 4,
		UNSECURE_ALLOW_ALL_PASSWORDS = 8
	};


	extern Mnemonic g_Mnemonic_WordLists[MNEMONIC_MAX];

	extern ObfusArray* g_ServerCryptoKey;
	extern ObfusArray* g_ServerKeySeed;

	//extern unsigned char g_ServerAdminPublic[];
	extern UniLib::controller::CPUSheduler* g_CPUScheduler;
	extern UniLib::controller::CPUSheduler* g_CryptoCPUScheduler;
	extern Poco::Net::Context::Ptr g_SSL_CLient_Context;
	extern Poco::Util::Timer	   g_CronJobsTimer;
	extern EmailAccount g_EmailAccount;
	extern int g_SessionTimeout;
	extern std::string g_serverPath;
	extern int		   g_serverPort;
	extern Languages g_default_locale;
	extern std::string g_php_serverPath;
	extern std::string g_php_serverHost;
	extern int         g_phpServerPort;
	extern Poco::Mutex g_TimeMutex;
	extern int         g_FakeLoginSleepTime;
	extern std::string g_versionString;
	extern bool		   g_disableEmail;
	extern ServerSetupType g_ServerSetupType;
	extern std::string g_gRPCRelayServerFullURL;
	extern MemoryBin*  g_CryptoAppSecret;
	extern AllowUnsecure g_AllowUnsecureFlags;

	bool loadMnemonicWordLists();
	bool initServerCrypto(const Poco::Util::LayeredConfiguration& cfg);
	bool initEMailAccount(const Poco::Util::LayeredConfiguration& cfg);
	bool initSSLClientContext();
	

	void writeToFile(std::istream& datas, std::string fileName);

	void unload();
};

#endif //__GRADIDO_LOGIN_SERVER_SERVER_CONFIG__