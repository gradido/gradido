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
	std::string amountString = ss.str();
	if (amountString.find('.') != amountString.npos) {
		int pointPlace = amountString.find('.');
		if (amountString.substr(pointPlace+1) == "00") {
			amountString = amountString.substr(0, pointPlace);
		}
	}
	return amountString;
	//return ss.str();
}
