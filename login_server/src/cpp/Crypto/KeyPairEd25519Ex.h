#ifndef __GRADIDO_LOGIN_SERVER_CRYPTO_ED25519_EXTENDED_H
#define __GRADIDO_LOGIN_SERVER_CRYPTO_ED25519_EXTENDED_H

#include "KeyPairEd25519.h"

/*!
 * \author: Dario Rekowski
 *
 * \date: 2021-07-01
 *
 * \brief: Key Pairs class for ed25519 extended keys, mainly used for derivation
*/

class KeyPairEd25519Ex: public KeyPairEd25519
{
public:
	//! \param privateKey: take ownership, release after object destruction
	//! \param publicKey: copy
	KeyPairEd25519Ex(MemoryBin* privateKeyEx, MemoryBin* chainCode, int derivationIndex);
	KeyPairEd25519Ex(const unsigned char* publicKey, MemoryBin* chainCode, int derivationIndex);

	 ~KeyPairEd25519Ex();

	//! \return caller take ownership of return value
	MemoryBin* sign(const unsigned char* message, size_t messageSize) const;

	bool isChildOf(KeyPairEd25519* parent);

protected:

	KeyPairEd25519Ex();


private:
	int        mDerivationIndex;
};

#endif //__GRADIDO_LOGIN_SERVER_CRYPTO_ED25519_EXTENDED_H