#include "TransactionBase.h"
#include <iomanip>


TransactionBase::TransactionBase(const std::string& memo)
	: mMemo(memo)
{

}

std::string TransactionBase::amountToString(google::protobuf::int64 amount)
{
	std::stringstream ss;
	double dAmount = amount / 10000.0;
	ss << std::fixed << std::setprecision(2) << dAmount;
	return ss.str();
}
