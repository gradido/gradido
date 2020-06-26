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

#pragma warning(disable:4800)

#include "TransactionBase.h"
#include "../proto/gradido/Transfer.pb.h"

#include "../controller/User.h"

class TransactionTransfer : public TransactionBase
{
public:
	TransactionTransfer(const std::string& memo, const model::messages::gradido::Transfer& protoTransfer);
	~TransactionTransfer();

	int prepare(); 

	inline size_t getKontoTableSize() { lock(); size_t s = mKontoTable.size(); unlock(); return s; }
	const std::string& getKontoNameCell(int index);
	const std::string& getAmountCell(int index);

protected:
	const static std::string mInvalidIndexMessage;

	struct KontoTableEntry 
	{
	public:
		KontoTableEntry(model::table::User* user, google::protobuf::int64 amount, bool negativeAmount = false);
		KontoTableEntry(const std::string& pubkeyHex, google::protobuf::int64 amount, bool negativeAmount = false);
		// first name, last name and email or pubkey hex if no user in db found
		std::string kontoNameCell;
		std::string amountCell;

	protected:
		void composeAmountCellString(google::protobuf::int64 amount, bool negativeAmount);
	};

	const model::messages::gradido::Transfer& mProtoTransfer;
	std::vector<KontoTableEntry> mKontoTable;
};

#endif //GRADIDO_LOGIN_SERVER_MODEL_TRANSACTION_TRANSFER_INCLUDE