#include "KeyPair.h"

#include <memory.h>
#include <string.h>

#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/ConnectionManager.h"

#include "Poco/Types.h"

#include "Passphrase.h"

#include "../ServerConfig.h"
#include "../lib/Profiler.h"

using namespace Poco::Data::Keywords;

#define STR_BUFFER_SIZE 25



KeyPair::KeyPair()
	: mPrivateKey(nullptr), mSodiumSecret(nullptr)
{
	// TODO: set memory to zero for
	// unsigned char mPublicKey[ed25519_pubkey_SIZE];
	// unsigned char mSodiumPublic[crypto_sign_PUBLICKEYBYTES];
	memset(mPublicKey, 0, ed25519_pubkey_SIZE);
	memset(mSodiumPublic, 0, crypto_sign_PUBLICKEYBYTES);
}

KeyPair::~KeyPair()
{
	auto mm = MemoryManager::getInstance();
	//printf("[KeyPair::~KeyPair] privkey: %d, soduium privkey: %d \n", mPrivateKey, mSodiumSecret);
	if (mPrivateKey) {
		//delete mPrivateKey;
		mm->releaseMemory(mPrivateKey);
		mPrivateKey = nullptr;
	}
	if (mSodiumSecret) {
		//delete mSodiumSecret;
		mm->releaseMemory(mSodiumSecret);
		mSodiumSecret = nullptr;
	}
}

std::string KeyPair::passphraseTransform(const std::string& passphrase, const Mnemonic* currentWordSource, const Mnemonic* targetWordSource)
{
	if (!currentWordSource || !targetWordSource) {
		return "";
	}
	if (targetWordSource == currentWordSource) {
		return passphrase;
	}
	auto word_indices = createWordIndices(passphrase, currentWordSource);
	if (!word_indices) {
		return "";
	}
	
	return createClearPassphraseFromWordIndices(word_indices, targetWordSource);
}

bool KeyPair::generateFromPassphrase(const char* passphrase, const Mnemonic* word_source)
{
	auto er = ErrorManager::getInstance();
	auto mm = MemoryManager::getInstance();
	// libsodium doc: https://libsodium.gitbook.io/doc/advanced/hmac-sha2
	// https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
	//crypto_auth_hmacsha512_keygen
	auto word_indices = createWordIndices(passphrase, word_source);
	if (!word_indices) {
		return false;
	}
	printf("word indices:      ");
	const Poco::UInt64* word_data = (const Poco::UInt64*)word_indices->data();
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		printf("%d ", word_data[i]);
	}
	printf("\n");
	std::string clearPassphrase =
		createClearPassphraseFromWordIndices(word_indices, &ServerConfig::g_Mnemonic_WordLists[ServerConfig::MNEMONIC_BIP0039_SORTED_ORDER]);

	printf("clear passphrase: %s\n", clearPassphrase.data());
	sha_context state;

	unsigned char hash[SHA_512_SIZE];
	//crypto_auth_hmacsha512_state state;
	size_t word_index_size = sizeof(word_indices);
	//crypto_auth_hmacsha512_init(&state, (unsigned char*)word_indices, sizeof(word_indices));
	sha512_init(&state);

	Profiler timeUsed;
	sha512_update(&state, *word_indices, word_indices->size());
	printf("time used in one step: %s\n", timeUsed.string().data());
	sha512_update(&state, (unsigned char*)clearPassphrase.data(), clearPassphrase.size());
	//crypto_auth_hmacsha512_update(&state, (unsigned char*)passphrase, pass_phrase_size);
	sha512_final(&state, hash);
	//crypto_auth_hmacsha512_final(&state, hash);
	
	/*
	// debug passphrase
	printf("\passsphrase: <%s>\n", passphrase);
	printf("size word indices: %u\n", word_indices->size());
	std::string word_indicesHex = getHex(*word_indices, word_indices->size());
	printf("word_indices: \n%s\n", word_indicesHex.data());
	printf("word_indices: \n");
	Poco::UInt64* word_indices_p = (Poco::UInt64*)(word_indices->data());
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		if (i > 0) printf(" ");
		printf("%4hu", word_indices_p[i]);
	}
	printf("\n");
	
	printf("\nclear passphrase: \n%s\n", clearPassphrase.data());
	std::string hex_clearPassphrase = getHex((const unsigned char*)clearPassphrase.data(), clearPassphrase.size());
	printf("passphrase bin: \n%s\n\n", hex_clearPassphrase.data());

	//*/

	mm->releaseMemory(word_indices);


	//ed25519_create_keypair(public_key, private_key, hash);
	private_key_t prv_key_t;
	memcpy(prv_key_t.data, hash, 32);
	public_key_t pbl_key_t;
	ed25519_derive_public_key(&prv_key_t, &pbl_key_t);

	//memcpy(private_key, prv_key_t.data, 32);
	if (!mPrivateKey) {
		//delete mPrivateKey;
		mPrivateKey = mm->getFreeMemory(ed25519_privkey_SIZE);
		if (!mPrivateKey) {
			return false;
		}
	}
	//mPrivateKey = new ObfusArray(ed25519_privkey_SIZE, prv_key_t.data);
	
	memcpy(*mPrivateKey, prv_key_t.data, ed25519_privkey_SIZE);

	memcpy(mPublicKey, pbl_key_t.data, ed25519_pubkey_SIZE);

	if (!mSodiumSecret) {
		//delete mSodiumSecret;
		//mm->releaseMemory(mSodiumSecret);
		mSodiumSecret = mm->getFreeMemory(crypto_sign_SECRETKEYBYTES);
	}
	//unsigned char sodium_secret[crypto_sign_SECRETKEYBYTES];


	crypto_sign_seed_keypair(mSodiumPublic, *mSodiumSecret, *mPrivateKey);
	

	// print hex for all keys for debugging
/*	printf("// ********** Keys ************* //\n");
	printf("Public: \t%s\n", getHex(mPublicKey, ed25519_pubkey_SIZE).data());
	printf("Private: \t%s\n", getHex(*mPrivateKey, mPrivateKey->size()).data());
	printf("Sodium Public: \t%s\n", getHex(mSodiumPublic, crypto_sign_PUBLICKEYBYTES).data());
	printf("Sodium Private: \t%s\n", getHex(*mSodiumSecret, mSodiumSecret->size()).data());
	printf("// ********* Keys End ************ //\n");
*/
	//printf("[KeyPair::generateFromPassphrase] finished!\n");
	// using 
	return true;
}

bool KeyPair::generateFromPassphrase(const std::string& passphrase)
{
	//static bool validatePassphrase(const std::string& passphrase, Mnemonic** wordSource = nullptr);
	Mnemonic* wordSource = nullptr;
	if (validatePassphrase(passphrase, &wordSource)) {
		return generateFromPassphrase(passphrase.data(), wordSource);
	}
	return false;
}

MemoryBin* KeyPair::createWordIndices(const std::string& passphrase, const Mnemonic* word_source)
{
	auto er = ErrorManager::getInstance();
	auto mm = MemoryManager::getInstance();

	auto word_indices = mm->getFreeMemory(sizeof(Poco::UInt64) * PHRASE_WORD_COUNT);
	Poco::UInt64* word_indices_p = (Poco::UInt64*)(word_indices->data());
	//Poco::UInt64 word_indices_old[PHRASE_WORD_COUNT] = { 0 };
	//memset(word_indices_old, 0, PHRASE_WORD_COUNT * sizeof(Poco::UInt64));// *sizeof(unsigned long));
	memset(*word_indices, 0, word_indices->size());

	//DHASH key = DRMakeStringHash(passphrase);
	size_t pass_phrase_size = passphrase.size();
	
	char acBuffer[STR_BUFFER_SIZE]; memset(acBuffer, 0, STR_BUFFER_SIZE);
	size_t buffer_cursor = 0;

	// get word indices for hmac key
	unsigned char word_cursor = 0;
	for (auto it = passphrase.begin(); it != passphrase.end(); it++) 
	{
		if (*it == ' ') {
			if (buffer_cursor < 3) {
				continue;
			}
			if (PHRASE_WORD_COUNT > word_cursor && word_source->isWordExist(acBuffer)) {
				word_indices_p[word_cursor] = word_source->getWordIndex(acBuffer);
				//word_indices_old[word_cursor] = word_source->getWordIndex(acBuffer);
			}
			else {
				er->addError(new ParamError("KeyPair::generateFromPassphrase", "word didn't exist", acBuffer));
				er->sendErrorsAsEmail();
				mm->releaseMemory(word_indices);
				return nullptr;
			}
			word_cursor++;
			memset(acBuffer, 0, STR_BUFFER_SIZE);
			buffer_cursor = 0;

		}
		else {
			acBuffer[buffer_cursor++] = *it;
		}
	}
	if (PHRASE_WORD_COUNT > word_cursor && word_source->isWordExist(acBuffer)) {
		word_indices_p[word_cursor] = word_source->getWordIndex(acBuffer);
		//word_indices_old[word_cursor] = word_source->getWordIndex(acBuffer);
		word_cursor++;
	}
	//printf("word cursor: %d\n", word_cursor);
	/*if (memcmp(word_indices_p, word_indices_old, word_indices->size()) != 0) {

		printf("not identical\n");
		memcpy(word_indices_p, word_indices_old, word_indices->size());
	}*/
	return word_indices;
}

std::string KeyPair::createClearPassphraseFromWordIndices(MemoryBin* word_indices, const Mnemonic* word_source)
{
	Poco::UInt64* word_indices_p = (Poco::UInt64*)word_indices->data();
	std::string clearPassphrase;
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		if (i * sizeof(Poco::UInt64) >= word_indices->size()) break;
		auto word = word_source->getWord(word_indices_p[i]);
		if (word) {
			clearPassphrase += word;
			clearPassphrase += " ";
		}
	}
	return clearPassphrase;
}

std::string KeyPair::filterPassphrase(const std::string& passphrase)
{
	return Passphrase::filter(passphrase);
}

std::string KeyPair::getPubkeyHex()
{
	const size_t hexSize = crypto_sign_PUBLICKEYBYTES * 2 + 1;
	
	char hexString[hexSize];
	memset(hexString, 0, hexSize);
	sodium_bin2hex(hexString, hexSize, mSodiumPublic, crypto_sign_PUBLICKEYBYTES);

	return std::string(hexString);
}

std::string KeyPair::getHex(const unsigned char* data, Poco::UInt32 size)
{
	auto mm = MemoryManager::getInstance();
	
	Poco::UInt32 hexSize = size * 2 + 1;
	auto hexMem = mm->getFreeMemory(hexSize);
	//char* hexString = (char*)malloc(hexSize);
	memset(*hexMem, 0, hexSize);
	sodium_bin2hex(*hexMem, hexSize, data, size);
	std::string hex = (char*)*hexMem;
//	free(hexString);
	mm->releaseMemory(hexMem);

	return hex;
}

std::string KeyPair::getHex(const MemoryBin* data)
{
	return getHex(*data, data->size());
}

bool KeyPair::savePrivKey(int userId)
{
	auto cm = ConnectionManager::getInstance();
	auto em = ErrorManager::getInstance();
	auto mysql_session = cm->getConnection(CONNECTION_MYSQL_LOGIN_SERVER);
	Poco::Data::Statement update(mysql_session);
	Poco::Data::BLOB privkey_blob((const unsigned char*)(*mPrivateKey), mPrivateKey->size());

	update << "UPDATE users set privkey = ? where id = ?",
		use(privkey_blob), use(userId);
		
	try {
		if (update.execute() != 1) {
			em->addError(new ParamError("KeyPair::savePrivKey", "error writing privkey, user not found? ", std::to_string(userId)));
			em->sendErrorsAsEmail();
			return false;
		}
	} catch (Poco::Exception& ex) {
		em->addError(new ParamError("KeyPair::savePrivKey", "exception by running mysql", ex.displayText()));
		em->sendErrorsAsEmail();
		return false;
	}
	return true;
}

bool KeyPair::isPubkeysTheSame(const unsigned char* pubkey) const
{
	return sodium_memcmp(pubkey, mPublicKey, ed25519_pubkey_SIZE) == 0;
}

bool KeyPair::validatePassphrase(const std::string& passphrase, Mnemonic** wordSource/* = nullptr*/)
{
	std::istringstream iss(passphrase);
	std::vector<std::string> results(std::istream_iterator<std::string>{iss},
		std::istream_iterator<std::string>());

	for (int i = 0; i < ServerConfig::Mnemonic_Types::MNEMONIC_MAX; i++) {
		Mnemonic& m = ServerConfig::g_Mnemonic_WordLists[i];
		bool existAll = true;
		for (auto it = results.begin(); it != results.end(); it++) {
			if (*it == "\0" || *it == "" || it->size() < 3) continue;
			if (!m.isWordExist(*it)) {
				if (i == 1) {
					int zahl = 0;
				}
				//printf("wordlist: %d, word not found: %s\n", i, it->data());
				existAll = false;
				continue;
			}
		}
		if (existAll) {
			if (wordSource) {
				*wordSource = &m;
			}

			return true;
		}
	}
	return false;
}
