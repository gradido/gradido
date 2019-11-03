/*!
*
* \author: einhornimmond
*
* \date: 25.10.19
*
* \brief: Interface for Transaction Objects
*/
#ifndef GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_BASE_INCLUDE
#define GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_BASE_INCLUDE

#include "../lib/ErrorList.h"
#include "../proto/gradido/BasicTypes.pb.h"

class TransactionBase : public ErrorList
{
public:
	TransactionBase(const std::string& memo);
	virtual int prepare() = 0;

	static std::string amountToString(google::protobuf::int64 amount);
	inline const std::string& getMemo() const { return mMemo; }

protected:
	std::string mMemo;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_BASE_INCLUDE