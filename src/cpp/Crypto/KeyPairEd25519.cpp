
#include "KeyPairEd25519.h"
#include <assert.h>
// using sha512 from iroha-ed because it need half the time as sodium
#include "ed25519/ed25519.h"

#include "../SingletonManager/ErrorManager.h"

#include "../lib/DataTypeConverter.h"
#include "../lib/Profiler.h"

#include "Passphrase.h"

KeyPairEd25519::KeyPairEd25519(MemoryBin* privateKey, const unsigned char* publicKey)
	: mSodiumSecret(privateKey)
{
	memcpy(mSodiumPublic, publicKey, crypto_sign_PUBLICKEYBYTES);
}

KeyPairEd25519::KeyPairEd25519(const unsigned char* publicKey)
	: mSodiumSecret(nullptr)
{
	memcpy(mSodiumPublic, publicKey, crypto_sign_PUBLICKEYBYTES);
}

KeyPairEd25519::KeyPairEd25519()
	: mSodiumSecret(nullptr)
{
	memset(mSodiumPublic, 0, crypto_sign_PUBLICKEYBYTES);
}

KeyPairEd25519::~KeyPairEd25519()
{
	if (mSodiumSecret) {
		MemoryManager::getInstance()->releaseMemory(mSodiumSecret);
		mSodiumSecret = nullptr;
	}
}

KeyPairEd25519* KeyPairEd25519::create(const Passphrase* passphrase)
{
	//auto er = ErrorManager::getInstance();
	auto mm = MemoryManager::getInstance();
	assert(passphrase);
	// libsodium doc: https://libsodium.gitbook.io/doc/advanced/hmac-sha2
	// https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
	//crypto_auth_hmacsha512_keygen
	auto word_indices = passphrase->getWordIndices();
	//auto word_indices = createWordIndices(passphrase, word_source);
	if (!word_indices) {
		return nullptr;
	}
	std::string clear_passphrase = passphrase->createClearPassphrase();
	
	crypto_hash_sha512_state state;
	//sha_context state;

	unsigned char hash[crypto_hash_sha512_BYTES];
	//crypto_auth_hmacsha512_state state;
	size_t word_index_size = sizeof(word_indices);
	//crypto_auth_hmacsha512_init(&state, (unsigned char*)word_indices, sizeof(word_indices));
	Profiler timeSum;
	crypto_hash_sha512_init(&state);
	//sha512_init(&state);
	Profiler timeUsed;
	//Poco::UInt64 valueBuffer[PHRASE_WORD_COUNT];
	auto value_buffer = mm->getFreeMemory(PHRASE_WORD_COUNT * sizeof(Poco::UInt64));
	Poco::UInt64* value_buffer_p = (Poco::UInt64*)value_buffer->data();
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		value_buffer_p[i] = word_indices[i];
	}
	auto betweenTime = timeUsed.string();
	//crypto_hash_sha512_update(&state, *value_buffer, sizeof(Poco::UInt64) * PHRASE_WORD_COUNT);
	//sha512_update(&state, *value_buffer, sizeof(Poco::UInt64) * PHRASE_WORD_COUNT);
	Profiler timeUsed2;
	//sha512_update(&state, (const unsigned char*)value_buffer_p, value_buffer->size());
	crypto_hash_sha512_update(&state, (const unsigned char*)value_buffer_p, value_buffer->size());
	//sha512_update(&state, *value_buffer, value_buffer->size());
	auto timeUsed2String = timeUsed2.string();
	//crypto_hash_sha512_update(&state, (const unsigned char*)word_indices, PHRASE_WORD_COUNT * sizeof(Poco::UInt16));
	crypto_hash_sha512_update(&state, (unsigned char*)clear_passphrase.data(), clear_passphrase.size());
	//sha512_update(&state, (unsigned char*)clear_passphrase.data(), clear_passphrase.size());
	//crypto_auth_hmacsha512_update(&state, (unsigned char*)passphrase, pass_phrase_size);
	//crypto_hash_sha512_final(&state, hash);
	//sha512_final(&state, hash);
	crypto_hash_sha512_final(&state, hash);
	printf("timeSum: %s\n", timeSum.string().data());
	printf("time used in for loop: %s (between: %s)\n", timeUsed2String.data(), betweenTime.data());
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

	KeyPairEd25519* key_pair = new KeyPairEd25519;
	if (!key_pair->mSodiumSecret) {
		key_pair->mSodiumSecret = mm->getFreeMemory(crypto_sign_SECRETKEYBYTES);
	}

	crypto_sign_seed_keypair(key_pair->mSodiumPublic, *key_pair->mSodiumSecret, hash);
	return key_pair;

	// print hex for all keys for debugging
	/*	printf("// ********** Keys ************* //\n");
	printf("Sodium Public: \t%s\n", getHex(mSodiumPublic, crypto_sign_PUBLICKEYBYTES).data());
	printf("Sodium Private: \t%s\n", getHex(*mSodiumSecret, mSodiumSecret->size()).data());
	printf("// ********* Keys End ************ //\n");
	*/
	//printf("[KeyPair::generateFromPassphrase] finished!\n");
	// using 
}

MemoryBin* KeyPairEd25519::sign(const MemoryBin* message)
{
	
	if (!message || !message->size()) return nullptr;
	if (!mSodiumSecret) return nullptr;
	auto messageSize = message->size();
	auto mm = MemoryManager::getInstance();
	auto em = ErrorManager::getInstance();

	const static char functionName[] = "KeyPairEd25519::sign";

	auto signBinBuffer = mm->getFreeMemory(crypto_sign_BYTES);
	unsigned long long actualSignLength = 0;

	if (crypto_sign_detached(*signBinBuffer, &actualSignLength, *message, messageSize, *mSodiumSecret)) {
		em->addError(new Error(functionName, "sign failed"));
		auto messageHex = DataTypeConverter::binToHex(message);
		em->addError(new ParamError(functionName, "message as hex", messageHex));
		mm->releaseMemory(signBinBuffer);
		return nullptr;
	}

	if (crypto_sign_verify_detached(*signBinBuffer, *message, messageSize, mSodiumPublic) != 0) {
		// Incorrect signature! 
		//printf("c[KeyBuffer::%s] sign verify failed\n", __FUNCTION__);
		em->addError(new Error(functionName, "sign verify failed"));
		auto messageHex = DataTypeConverter::binToHex(message);
		em->addError(new ParamError(functionName, "message as hex", messageHex));
		mm->releaseMemory(signBinBuffer);
		return nullptr;
	}

	// debug
	/*const size_t hex_sig_size = crypto_sign_BYTES * 2 + 1;
	char sig_hex[hex_sig_size];
	sodium_bin2hex(sig_hex, hex_sig_size, *signBinBuffer, crypto_sign_BYTES);
	printf("[User::sign] signature hex: %s\n", sig_hex);
	*/

	return signBinBuffer;

}