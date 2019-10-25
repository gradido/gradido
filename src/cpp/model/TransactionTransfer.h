/*!
*
* \author: einhornimmond
*
* \date: 25.10.19
*
* \brief: Creation Transaction
*/
#ifndef GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_TRANSFER_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_TRANSFER_INCLUDE

#include "TransactionBase.h"
#include "../proto/gradido/Transfer.pb.h"

class TransactionTransfer : public TransactionBase
{
public:
	TransactionTransfer(const model::messages::gradido::Transfer& protoTransfer);

	int prepare();

protected:
	const model::messages::gradido::Transfer& mProtoTransfer;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_TRANSFER_INCLUDE