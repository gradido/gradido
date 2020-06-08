#ifndef __GRADIDO_LOGIN_SERVER_CRYPTO_I_KEY_PAIR_H
#define __GRADIDO_LOGIN_SERVER_CRYPTO_I_KEY_PAIR_H

/*!
 *
 * \author: Dario Rekowski
 * 
 * \date: 2020-06-04
 * 
 * \brief: Interface for Key Pair classes, generate key pair from passphrase
 *
 */

#include "../SingletonManager/MemoryManager.h"

class IKeyPair 
{
public:
	//! \return caller take ownership of return value
	virtual MemoryBin* sign(const MemoryBin* message) const = 0 ;


};

#endif //__GRADIDO_LOGIN_SERVER_CRYPTO_I_KEY_PAIR_H