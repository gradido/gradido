#ifndef GRADIDO_LOGIN_SERVER_TASKS_SIGNING_TRANSACTION_INCLUDE 
#define GRADIDO_LOGIN_SERVER_TASKS_SIGNING_TRANSACTION_INCLUDE

#include "CPUTask.h"

#include "../lib/ErrorList.h"
#include "../model/TransactionBase.h"
#include "../model/User.h"
#include "../controller/User.h"

#include "../proto/gradido/Transaction.pb.h"

#include "ProcessingTransaction.h"

/*
* @author: Dario Rekowski
*
* @date: 28.10.19
* @desc: Task for signing Transactions
*/

class SigningTransaction : public UniLib::controller::CPUTask, public ErrorList
{
public:
	SigningTransaction(Poco::AutoPtr<ProcessingTransaction> processingeTransaction, Poco::AutoPtr<controller::User> newUser, bool sendErrorsToAdmin = true);
	virtual ~SigningTransaction();

	int run();

	const char* getResourceType() const { return "SigningTransaction"; };

	

protected:
	Poco::AutoPtr<ProcessingTransaction> mProcessingeTransaction;
	Poco::AutoPtr<controller::User> mNewUser;
	bool mSendErrorsToAdminEmail;

private:

	std::string getUserEmail();

};


#endif //GRADIDO_LOGIN_SERVER_TASKS_SIGNING_TRANSACTION_INCLUDE