#include "KeyPairEd25519Ex.h"
#include "ed25519_bip32_c_interface.h"

KeyPairEd25519Ex::KeyPairEd25519Ex(const unsigned char* publicKey, MemoryBin* chainCode, int derivationIndex)
	: KeyPairEd25519(publicKey, chainCode), mDerivationIndex(derivationIndex)
{

}

KeyPairEd25519Ex::KeyPairEd25519Ex(MemoryBin* privateKeyEx, MemoryBin* chainCode, int derivationIndex)
	: KeyPairEd25519(privateKeyEx, chainCode), mDerivationIndex(derivationIndex)
{

}

KeyPairEd25519Ex::KeyPairEd25519Ex()
	: mDerivationIndex(0)
{

}

KeyPairEd25519Ex::~KeyPairEd25519Ex()
{
	
}

MemoryBin* KeyPairEd25519Ex::sign(const unsigned char* message, size_t messageSize) const
{
	auto mm = MemoryManager::getInstance();
	auto secret_key = getSecretKey();
	if (!secret_key) return nullptr;
	auto signature = mm->getFreeMemory(64);
	sign_extended(message, messageSize, *secret_key, *signature);
	return signature;
}

bool KeyPairEd25519Ex::isChildOf(KeyPairEd25519* parent)
{
	auto mm = MemoryManager::getInstance();
	auto parent_chain_code = parent->getChainCode();
	assert(parent_chain_code);
	auto temp_chain_code = mm->getFreeMemory(32);
	auto temp_child_public = mm->getFreeMemory(32);

	bool result = false;
	if (derivePublicKey(parent->getPublicKey(), *parent->getChainCode(), mDerivationIndex, *temp_child_public, *temp_chain_code)) {
		if (isTheSame(temp_child_public)) {
			result = true;
		}
	}
	mm->releaseMemory(temp_chain_code);
	mm->releaseMemory(temp_child_public);

	return result;
	
}
