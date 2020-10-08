#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_PENDING_TASK_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_PENDING_TASK_INCLUDE

#include "../model/table/PendingTask.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"

namespace controller {


	typedef Poco::Tuple<int, std::string, int, int, int, int, Poco::UInt64, Poco::UInt64, Poco::UInt64, Poco::DateTime> NodeServerFullTuple;

	class PendingTask : public TableControllerBase
	{
	public:

		~PendingTask();

		static Poco::AutoPtr<PendingTask> create(int userId, std::string serializedProtoRequest, model::table::TaskType type);

		static std::vector<Poco::AutoPtr<PendingTask>> load(int userId);
		
		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }

		inline Poco::AutoPtr<model::table::PendingTask> getModel() { return _getModel<model::table::PendingTask>(); }

		
	protected:
		PendingTask(model::table::PendingTask* dbModel);
		

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_PENDING_TASK_INCLUDE