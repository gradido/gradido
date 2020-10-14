#include "GradidoTask.h"

GradidoTask::GradidoTask(model::table::PendingTask* dbModel, Poco::AutoPtr<model::gradido::TransactionBody> transactionBody)
	: controller::PendingTask(dbModel), mGradidoTransactionBody(transactionBody)
{

}