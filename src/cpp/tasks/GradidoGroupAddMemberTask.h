#ifndef GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_GROUP_ADD_MEMBER_TASK_H
#define GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_GROUP_ADD_MEMBER_TASK_H

#include "GradidoTask.h"
#include "../controller/User.h"
#include "../controller/Group.h"

class GradidoGroupAddMemberTask : public GradidoTask
{
public:
	GradidoGroupAddMemberTask(model::table::PendingTask* dbModel, Poco::AutoPtr<model::gradido::TransactionBody> transactionBody);

	static Poco::AutoPtr<controller::PendingTask> create(Poco::AutoPtr<controller::User> user, Poco::AutoPtr<controller::Group> group, const std::string& memo);

protected:

};

#endif //GRADIDO_LOGIN_SERVER_TASKS_GRADIDO_GROUP_ADD_MEMBER_TASK_H