#include "GradidoTask.h"

GradidoTask::GradidoTask()
	: controller::PendingTask(new model::table::PendingTask)
{

}

GradidoTask::GradidoTask(model::table::PendingTask* dbModel)
	: controller::PendingTask(dbModel)
{
	
}