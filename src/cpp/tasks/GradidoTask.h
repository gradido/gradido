#ifndef GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_TASK
#define GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_TASK

#include "../controller/PendingTask.h"
#include "../model/gradido/TransactionBody.h"

class GradidoTask : public controller::PendingTask, public NotificationList
{
public:
	GradidoTask();
	GradidoTask(model::table::PendingTask* dbModel);
	bool isTimeoutTask() { return false; }

protected:

	
};

#endif //GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_TASK