/*!
*
* \author: einhornimmond
*
* \date: 25.10.19
*
* \brief: Creation Transaction
*/
#ifndef GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_CREATION_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_CREATION_INCLUDE

#pragma warning(disable:4800)

#include "TransactionBase.h"
#include "../proto/gradido/TransactionCreation.pb.h"
#include "User.h"

class TransactionCreation : public TransactionBase
{
public:
	TransactionCreation(const std::string& memo, const model::messages::gradido::TransactionCreation& protoCreation);
	~TransactionCreation();

	int prepare();

	inline User* getUser() { return mReceiverUser; }
	inline google::protobuf::int64 getAmount() { return mProtoCreation.receiveramount().amount(); }
	inline char* getPublicHex() { return mReceiverPublicHex; }

	inline std::string getAmountString() { return amountToString(getAmount()); }

protected:
	const model::messages::gradido::TransactionCreation& mProtoCreation;
	char mReceiverPublicHex[65];
	User* mReceiverUser;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_CREATION_INCLUDE