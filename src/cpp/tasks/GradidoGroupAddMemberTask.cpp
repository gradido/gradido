#include "GradidoGroupAddMemberTask.h"
#include "../model/gradido/GroupMemberUpdate.h"

GradidoGroupAddMemberTask::GradidoGroupAddMemberTask(model::table::PendingTask* dbModel, Poco::AutoPtr<model::gradido::TransactionBody> transactionBody)
	: GradidoTask(dbModel, transactionBody)
{

}


Poco::AutoPtr<controller::PendingTask> GradidoGroupAddMemberTask::create(Poco::AutoPtr<controller::User> user, Poco::AutoPtr<controller::Group> group, const std::string& memo)
{
	if (user.isNull() || !user->getModel() || group.isNull() || !group->getModel()) {
		return nullptr;
	}
	static const char* function_name = "GradidoGroupAddMemberTask::create";
	auto group_model = group->getModel();
	auto transaction = model::gradido::TransactionBody::create(memo, user, proto::gradido::GroupMemberUpdate_MemberUpdateType_ADD_USER, group_model->getAlias());
	auto user_model = user->getModel();
	auto dbModel = new model::table::PendingTask(user_model->getID(), transaction->getBodyBytes(), model::table::TASK_TYPE_GROUP_ADD_MEMBER);
	if (!dbModel->insertIntoDB(true)) {
		dbModel->addError(new Error(function_name, "error inserting pending task into db, abort"));
		dbModel->sendErrorsAsEmail();		
		return nullptr;
	}
	return new GradidoGroupAddMemberTask(dbModel, transaction);
}