
#include "KeyPairEd25519.h"
#include "KeyPairEd25519Ex.h"
#include <assert.h>

#include "../SingletonManager/ErrorManager.h"

#include "../lib/DataTypeConverter.h"

#include "ed25519_bip32_c_interface.h"

KeyPairEd25519::KeyPairEd25519(MemoryBin* privateKey, MemoryBin* chainCode/* = nullptr*/)
	: mSodiumSecret(privateKey), mChainCode(chainCode)
{
	//memcpy(mSodiumPublic, publicKey, crypto_sign_PUBLICKEYBYTES);
	// read pubkey from private key, so we are sure it is the correct pubkey for the private key

	crypto_sign_ed25519_sk_to_pk(mSodiumPublic, *privateKey);
}

KeyPairEd25519::KeyPairEd25519(const unsigned char* publicKey, MemoryBin* chainCode /* = nullptr*/ )
	: mSodiumSecret(nullptr), mChainCode(chainCode)
{
	memcpy(mSodiumPublic, publicKey, crypto_sign_PUBLICKEYBYTES);
	mChainCode = chainCode;
}

KeyPairEd25519::KeyPairEd25519()
	: mSodiumSecret(nullptr), mChainCode(nullptr)
{
	memset(mSodiumPublic, 0, crypto_sign_PUBLICKEYBYTES);
}

KeyPairEd25519::~KeyPairEd25519()
{
	auto mm = MemoryManager::getInstance();
	if (mSodiumSecret) {
		mm->releaseMemory(mSodiumSecret);
		mSodiumSecret = nullptr;
	}
	if (mChainCode) {
		mm->releaseMemory(mChainCode);
		mChainCode = nullptr;
	}
}

KeyPairEd25519* KeyPairEd25519::create(const Poco::AutoPtr<Passphrase> passphrase)
{
	//auto er = ErrorManager::getInstance();
	auto mm = MemoryManager::getInstance();
	assert(!passphrase.isNull());
	// libsodium doc: https://libsodium.gitbook.io/doc/advanced/hmac-sha2
	// https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
	
	auto word_indices = passphrase->getWordIndices();
	
	if (!word_indices || (!word_indices[0] && !word_indices[1] && !word_indices[2] && !word_indices[3])) {
		return nullptr;
	}
	std::string clear_passphrase = passphrase->createClearPassphrase();
	

	unsigned char hash[crypto_hash_sha512_BYTES];

	crypto_hash_sha512_state state;
	crypto_hash_sha512_init(&state);

	// ****  convert word indices into uint64  ****
	// To prevent breaking existing passphrase-hash combinations word indices will be put into 64 Bit Variable to mimic first implementation of algorithms
	auto valueSize = sizeof(Poco::UInt64);
	Poco::UInt64 value = 0;
	for (int i = 0; i < PHRASE_WORD_COUNT; i++) {
		value = word_indices[i];
		crypto_hash_sha512_update(&state, (const unsigned char*)&value, valueSize);
	}	
	// **** end converting into uint64 *****
	crypto_hash_sha512_update(&state, (unsigned char*)clear_passphrase.data(), clear_passphrase.size());
	crypto_hash_sha512_final(&state, hash);
	
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
	if (!key_pair->mChainCode) {
		key_pair->mChainCode = mm->getFreeMemory(32);
	}
	
	crypto_sign_seed_keypair(key_pair->mSodiumPublic, *key_pair->mSodiumSecret, hash);

	memcpy(key_pair->mChainCode->data(), &hash[32], 32);
	
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
MemoryBin* KeyPairEd25519::sign(const unsigned char* message, size_t messageSize) const
//MemoryBin* KeyPairEd25519::sign(const MemoryBin* message) const
{
	
	if (!message || !messageSize) return nullptr;
	if (!mSodiumSecret) return nullptr;
	auto mm = MemoryManager::getInstance();
	auto em = ErrorManager::getInstance();

	const static char functionName[] = "KeyPairEd25519::sign";

	auto signBinBuffer = mm->getFreeMemory(crypto_sign_BYTES);
	unsigned long long actualSignLength = 0;

	if (crypto_sign_detached(*signBinBuffer, &actualSignLength, message, messageSize, *mSodiumSecret)) {
		em->addError(new Error(functionName, "sign failed"));
		auto messageHex = DataTypeConverter::binToHex(message, messageSize);
		em->addError(new ParamError(functionName, "message as hex", messageHex));
		mm->releaseMemory(signBinBuffer);
		return nullptr;
	}

	if (crypto_sign_verify_detached(*signBinBuffer, message, messageSize, mSodiumPublic) != 0) {
		// Incorrect signature! 
		//printf("c[KeyBuffer::%s] sign verify failed\n", __FUNCTION__);
		em->addError(new Error(functionName, "sign verify failed"));
		auto messageHex = DataTypeConverter::binToHex(message, messageSize);
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

bool KeyPairEd25519::verify(const std::string& message, const std::string& signature) const
{
	if (message == "" || signature == "") return false;
	if (crypto_sign_verify_detached((const unsigned char*)signature.data(), (const unsigned char*)message.data(), message.size(), mSodiumPublic) != 0) {
		return false;
	}
	return true;
}

bool KeyPairEd25519::is3rdHighestBitClear() const
{
	assert(mChainCode);
	assert(mSodiumSecret);
	return is_3rd_highest_bit_clear(*mSodiumSecret, *mChainCode);
}

DerivationType KeyPairEd25519::getDerivationType(Poco::UInt32 index)
{
	if(index >= 0x80000000) {
		return DERIVATION_HARD;
	}
	else {
		return DERIVATION_SOFT;
	}
}

KeyPairEd25519Ex* KeyPairEd25519::deriveChild(Poco::UInt32 index, NotificationList* errors /* = nullptr*/)
{
	auto mm = MemoryManager::getInstance();
	auto temp_key = mm->getFreeMemory(32);
	auto temp_chain_code = mm->getFreeMemory(32);

	KeyPairEd25519Ex* result = nullptr;

	if (hasPrivateKey()) {
		derivePrivateKey(mSodiumPublic, *mChainCode, index, *temp_key, *temp_chain_code);
		result = new KeyPairEd25519Ex(temp_key, temp_chain_code, index);
	}
	else {
		if (derivePublicKey(*mSodiumSecret, *mChainCode, index, *temp_key, *temp_chain_code)) {
			result = new KeyPairEd25519Ex(*temp_key, temp_chain_code, index);
		} else if(errors) {
			static const char* function_name = "KeyPairEd25519::deriveChild";
			if (getDerivationType(index) == DERIVATION_HARD) {
				errors->addError(new ParamError(function_name, "hard derivation with public key not possible", index));
			}
			else {
				errors->addError(new Error(function_name, "derivePublicKey failed"));
			}
		}
		if(!result) {
			mm->releaseMemory(temp_chain_code);
		}
		mm->releaseMemory(temp_key);
	}
	return result;
}

MemoryBin* KeyPairEd25519::getCryptedPrivKey(const Poco::AutoPtr<SecretKeyCryptography> password) const
{
	if (password.isNull()) return nullptr;
	if (!mSodiumSecret) return nullptr;

	MemoryBin* encryptedKey = nullptr;
	if (SecretKeyCryptography::AUTH_ENCRYPT_OK == password->encrypt(mSodiumSecret, &encryptedKey)) {
		return encryptedKey;
	}
	else {
		return nullptr;
	}

}
