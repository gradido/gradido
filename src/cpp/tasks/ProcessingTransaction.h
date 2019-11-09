#ifndef GRADIDO_LOGIN_SERVER_TASKS_PROCESSING_TRANSACTION_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_PROCESSING_TRANSACTION_INCLUDE

#include "CPUTask.h"

#include "../lib/ErrorList.h"
#include "../lib/DRHash.h"
#include "../model/TransactionBase.h"

#include "../proto/gradido/TransactionBody.pb.h"

/*
* @author: Dario Rekowski
*
* @date: 25.10.19
* @desc: Task for processing Transactions
*/

enum TransactionType {
	TRANSACTION_NONE,
	TRANSACTION_CREATION,
	TRANSACTION_TRANSFER
};

class TransactionCreation;
class TransactionTransfer;
class SigningTransaction;

class ProcessingTransaction : public UniLib::controller::CPUTask, public ErrorList
{
	friend SigningTransaction;
public:
	ProcessingTransaction(const std::string& proto_message_base64);
	virtual ~ProcessingTransaction();

	int run();

	const char* getResourceType() const { return "ProcessingTransaction"; };

	inline TransactionType getType() { lock(); auto t = mType; unlock(); return t; }
	std::string getMemo();
	
	// not secured zone, no locking
	bool isCreation() { return mType == TRANSACTION_CREATION; }
	bool isTransfer() { return mType == TRANSACTION_TRANSFER; }

	TransactionCreation* getCreationTransaction();
	TransactionTransfer* getTransferTransaction();

	static HASH calculateHash(const std::string& proto_message_base64);
	inline HASH getHash() { mHashMutex.lock(); HASH hs = mHash; mHashMutex.unlock(); return hs; }

	std::string getBodyBytes();

protected:
	TransactionType mType;
	std::string mProtoMessageBase64;

	model::messages::gradido::TransactionBody mTransactionBody;
	TransactionBase* mTransactionSpecific;

	HASH mHash;

	Poco::Mutex mHashMutex;
private:

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_PROCESSING_TRANSACTION_INCLUDE