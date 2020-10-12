#ifndef GRADIDO_LOGIN_SERVER_TASKS_PROCESSING_TRANSACTION_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_PROCESSING_TRANSACTION_INCLUDE

#include "CPUTask.h"

#include "../lib/NotificationList.h"
#include "../lib/DRHash.h"
#include "../model/gradido/TransactionBody.h"

#include "../SingletonManager/LanguageManager.h"

/*
* @author: Dario Rekowski
*
* @date: 25.10.19
* @desc: Task for processing Transactions
*/


namespace model {
	namespace gradido {
		class TransactionCreation;
		class TransactionTransfer;
		class GroupMemberUpdate;
	}
}
class SigningTransaction;


class ProcessingTransaction : public UniLib::controller::CPUTask, public NotificationList
{
	friend SigningTransaction;
public:
	//! \param lang for error messages in user language
	ProcessingTransaction(const std::string& proto_message_base64, DHASH userEmailHash, Languages lang, Poco::DateTime transactionCreated = Poco::DateTime());
	//ProcessingTransaction(const model::gradido::TransactionBody)
	virtual ~ProcessingTransaction();

	int run();

	const char* getResourceType() const { return "ProcessingTransaction"; };

	
	static HASH calculateHash(const std::string& proto_message_base64);
	static std::string calculateGenericHash(const std::string& protoMessageBase64);
	inline HASH getHash() { mHashMutex.lock(); HASH hs = mHash; mHashMutex.unlock(); return hs; }

	inline Poco::AutoPtr<model::gradido::TransactionBody> getTransactionBody() { return mTransactionBody; }
	

protected:

	void reportErrorToCommunityServer(std::string error, std::string errorDetails, std::string created);

	
	std::string mProtoMessageBase64;
	Poco::AutoPtr<model::gradido::TransactionBody> mTransactionBody;
	

	HASH mHash;
	DHASH mUserEmailHash;
	Languages mLang;
	Poco::Mutex mHashMutex;
	Poco::DateTime mTransactionCreated;
private:

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_PROCESSING_TRANSACTION_INCLUDE