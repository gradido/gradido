#include "KeyPair.h"

#include <memory.h>
#include <string.h>

#include "../SingletonManager/ErrorManager.h"
#include "../SingletonManager/ConnectionManager.h"

//#include "Poco/ISO8859_4Encoding.h"

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

bool KeyPair::generateFromPassphrase(const char* passphrase, Mnemonic* word_source)
{
	auto er = ErrorManager::getInstance();
	// libsodium doc: https://libsodium.gitbook.io/doc/advanced/hmac-sha2
	// https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
	//crypto_auth_hmacsha512_keygen
	unsigned long word_indices[PHRASE_WORD_COUNT];
	memset(word_indices, 0, PHRASE_WORD_COUNT);

	//DHASH key = DRMakeStringHash(passphrase);
	size_t pass_phrase_size = strlen(passphrase);
	std::string clearPassphrase = "";
	char acBuffer[STR_BUFFER_SIZE]; memset(acBuffer, 0, STR_BUFFER_SIZE);
	size_t buffer_cursor = 0;
	// get word indices for hmac key
	unsigned char word_cursor = 0;
	for (size_t i = 0; i <= pass_phrase_size; i++) {
		if (passphrase[i] == ' ' || passphrase[i] == '\0') {
			if(buffer_cursor < 3) continue;
			if (word_source->isWordExist(acBuffer)) {
				clearPassphrase += acBuffer;
				clearPassphrase += " ";
				word_indices[word_cursor] = word_source->getWordIndex(acBuffer);
				//printf("index for %s is: %hu\n", acBuffer, word_source->getWordIndex(acBuffer));
			}
			else {
				er->addError(new ParamError("KeyPair::generateFromPassphrase", "word didn't exist", acBuffer));
				er->sendErrorsAsEmail();
				return false;
			}

			word_cursor++;
			memset(acBuffer, 0, STR_BUFFER_SIZE);
			buffer_cursor = 0;
		}
		else {
			acBuffer[buffer_cursor++] = passphrase[i];
		}

	}
	sha_context state;

	unsigned char hash[SHA_512_SIZE];
	//crypto_auth_hmacsha512_state state;
	size_t word_index_size = sizeof(word_indices);
	//crypto_auth_hmacsha512_init(&state, (unsigned char*)word_indices, sizeof(word_indices));
	sha512_init(&state);
	sha512_update(&state, (unsigned char*)word_indices, sizeof(word_indices));
	sha512_update(&state, (unsigned char*)clearPassphrase.data(), clearPassphrase.size());
	//crypto_auth_hmacsha512_update(&state, (unsigned char*)passphrase, pass_phrase_size);
	sha512_final(&state, hash);
	//crypto_auth_hmacsha512_final(&state, hash);
	
	// debug passphrase
//	printf("\passsphrase: <%s>\n", passphrase);
	//printf("word_indices: \n%s\n", getHex((unsigned char*)word_indices, sizeof(word_indices)).data());
	/*printf("word_indices: \n");
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		if (i > 0) printf(" ");
		printf("%4hu", word_indices[i]);
	}
	printf("\n");
	//*/
	//printf("\nclear passphrase: \n%s\n", clearPassphrase.data());
//	printf("passphrase bin: \n%s\n\n", getHex((unsigned char*)passphrase, pass_phrase_size).data());

	//ed25519_create_keypair(public_key, private_key, hash);
	private_key_t prv_key_t;
	memcpy(prv_key_t.data, hash, 32);
	public_key_t pbl_key_t;
	ed25519_derive_public_key(&prv_key_t, &pbl_key_t);

	auto mm = MemoryManager::getInstance();

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

std::string KeyPair::filterPassphrase(const std::string& passphrase)
{
	std::string filteredPassphrase;
	auto passphrase_size = passphrase.size();
	for (int i = 0; i < passphrase_size; i++) {
		unsigned char c = passphrase.data()[i];
		// asci 128 even by utf8 (hex)
		// 0000 0000 – 0000 007F
		// utf8
		if (c > 0x0000007F) {
			int additionalUtfByteCount = 0;
			//filteredPassphrase += c;
			if ((c & 0x00000080) == 0x00000080) {
				// c3 a4 => ä
				// c3 bc => ü
				// c3 b6 => ö
				// c3 84 => Ä
				// c3 96 => Ö
				// c3 9c => Ü
				// c3 9f => ß

				std::vector<Poco::Tuple<int, std::string>> specialChars = {
					{0xa4, "auml"}, {0x84, "Auml"}, 
					{0xbc, "uuml"}, {0x9c, "Uuml"},
					{0xb6, "ouml"}, {0x96, "Ouml"},
					{0x9f, "szlig"}
				};

				unsigned char c2 = passphrase.data()[i + 1];
				bool insertedHtmlEntitie = false;
				for (auto it = specialChars.begin(); it != specialChars.end(); it++) {
					if (c2 == it->get<0>()) {
						auto htmlEntitie = it->get<1>();
						filteredPassphrase += "&";
						filteredPassphrase += htmlEntitie;
						filteredPassphrase += ";";
						i++;
						insertedHtmlEntitie = true;
						break;
					}
				}
				if (insertedHtmlEntitie) continue;
				additionalUtfByteCount = 1;
			}
			else if ((c & 0x00000800) == 0x00000800) {
				additionalUtfByteCount = 2;
			}
			else if ((c & 0x00010000) == 0x00010000) {
				additionalUtfByteCount = 3;
			}
			for (int j = 0; j <= additionalUtfByteCount; j++) {
				filteredPassphrase += passphrase.data()[i + j];
				i++;
			}
		}
		else {
			// 32 = Space
			// 65 = A
			// 90 = Z
			// 97 = a
			// 122 = z
			// 59 = ;
			// 38 = &
			if (c == 32 || c == 59 || c == 38 ||
				(c >= 65 && c <= 90) ||
				(c >= 97 && c <= 122)) {
				filteredPassphrase += c;
			}
			else if (c == '\n' || c == '\r') {
				filteredPassphrase += ' ';
			}
		}

	}
	return filteredPassphrase;
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