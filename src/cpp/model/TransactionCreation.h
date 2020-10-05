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
#include "../proto/gradido/GradidoCreation.pb.h"
#include "../controller/User.h"

class TransactionCreation : public TransactionBase
{
public:
	TransactionCreation(const std::string& memo, const proto::gradido::GradidoCreation& protoCreation);
	~TransactionCreation();

	int prepare();

	inline Poco::AutoPtr<controller::User> getUser() { return mReceiverUser; }
	inline google::protobuf::int64 getAmount() { return mProtoCreation.receiver().amount(); }
	inline char* getPublicHex() { return mReceiverPublicHex; }

	inline std::string getAmountString() { return amountToString(getAmount()); }
	std::string getTargetDateString();

protected:
	const proto::gradido::GradidoCreation& mProtoCreation;
	char mReceiverPublicHex[65];
	Poco::AutoPtr<controller::User> mReceiverUser;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_CREATION_INCLUDE