#ifndef GRADIDO_LOGIN_SERVER_CONTROLLER_PENDING_TASK_INCLUDE
#define GRADIDO_LOGIN_SERVER_CONTROLLER_PENDING_TASK_INCLUDE

#include "../model/table/PendingTask.h"

#include "Poco/SharedPtr.h"

#include "TableControllerBase.h"
#include "User.h"

namespace controller {


	typedef Poco::Tuple<int, std::string, int, int, int, int, Poco::UInt64, Poco::UInt64, Poco::UInt64, Poco::DateTime> NodeServerFullTuple;

	class PendingTask : public TableControllerBase
	{
	public:

		~PendingTask();

		static Poco::AutoPtr<PendingTask> create(int userId, std::string serializedProtoRequest, model::table::TaskType type);

		static std::vector<Poco::AutoPtr<PendingTask>> load(int userId);
		static std::vector<Poco::AutoPtr<PendingTask>> loadAll();
		inline bool deleteFromDB() { return mDBModel->deleteFromDB(); }
		
		inline Poco::AutoPtr<model::table::PendingTask> getModel() { return _getModel<model::table::PendingTask>(); }
		//! \brief delete from db and remove from Pending Task Manager
		bool deleteFromDB();

		virtual bool isTimeoutTask() = 0;
		virtual Poco::DateTime getNextRunTime() { return Poco::DateTime(); };
		//! \return 1 run finished, more runs needed
		//! \return 0 run finished, no more runs needed
		//! \return -1 error, more runs needed
		//! \return -2 critical error, abort, remove
		virtual int run() { return false; };

		Poco::AutoPtr<controller::User> getUser();
		
	protected:
		static Poco::AutoPtr<PendingTask> loadCorrectDerivedClass(model::table::PendingTask* dbModel);
		PendingTask(model::table::PendingTask* dbModel);

		Poco::AutoPtr<controller::User> mUser;
		

	};
}

#endif //GRADIDO_LOGIN_SERVER_CONTROLLER_PENDING_TASK_INCLUDE