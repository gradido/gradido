#include "TestAuthenticatedEncryption.h"

#include "../../Crypto/AuthenticatedEncryption.h"

#include "../../lib/Profiler.h"
#include "../../lib/DataTypeConverter.h"

#include "../ServerConfig.h"

void TestAuthenticatedEncryption::SetUp()
{
	if (!ServerConfig::g_CryptoAppSecret) {
		ServerConfig::g_CryptoAppSecret = DataTypeConverter::hexToBin("21ffbbc616fe");
	}
	if (!ServerConfig::g_ServerCryptoKey) {
		auto serverKey = DataTypeConverter::hexToBin("a51ef8ac7ef1abf162fb7a65261acd7a");
		ServerConfig::g_ServerCryptoKey = new ObfusArray(serverKey->size(), *serverKey);
	}
}

TEST_F(TestAuthenticatedEncryption, encryptDecryptTest) {
	AuthenticatedEncryption authenticated_encryption;
	EXPECT_FALSE(authenticated_encryption.hasKey());
	EXPECT_EQ(authenticated_encryption.getKeyHashed(), 0);

	Profiler time_used;
	EXPECT_EQ(authenticated_encryption.createKey("dariofrodo@gmx.de", "r3an7d_spassw"), AuthenticatedEncryption::AUTH_ENCRYPT_OK);
	printf("create key duration: %s\n", time_used.string().data());

	EXPECT_TRUE(authenticated_encryption.hasKey());

	std::string test_message = "Dies ist eine Test Message zur Encryption";
	auto mm = MemoryManager::getInstance();
	auto test_message_bin = mm->getFreeMemory(test_message.size());
	MemoryBin* encrypted_message = nullptr;
	memcpy(*test_message_bin, test_message.data(), test_message.size());

	time_used.reset();
	EXPECT_EQ(authenticated_encryption.encrypt(test_message_bin, &encrypted_message), AuthenticatedEncryption::AUTH_ENCRYPT_OK);
	printf("encrypt message duration: %s\n", time_used.string().data());

	MemoryBin* decrypted_message = nullptr;
	time_used.reset();
	EXPECT_EQ(authenticated_encryption.decrypt(encrypted_message, &decrypted_message), AuthenticatedEncryption::AUTH_DECRYPT_OK);
	printf("decrypt message duration: %s\n", time_used.string().data());

	EXPECT_EQ(std::string((const char*)*decrypted_message, decrypted_message->size()), test_message);
//	*/
}