#ifndef GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_TASK
#define GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_TASK

#include "../controller/PendingTask.h"
#include "../model/gradido/TransactionBody.h"

class GradidoTask : public controller::PendingTask, public NotificationList
{
public:
	GradidoTask(model::table::PendingTask* dbModel, Poco::AutoPtr<model::gradido::TransactionBody> transactionBody);
	bool isTimeoutTask() { return false; }

protected:

	Poco::AutoPtr<model::gradido::TransactionBody> mGradidoTransactionBody;
};

#endif //GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_TASK