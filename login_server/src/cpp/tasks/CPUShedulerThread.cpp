#include "CPUShedulerThread.h"
#include "CPUSheduler.h"
#include "Task.h"
//#include "debug/CPUSchedulerTasksLog.h"

#ifdef _UNI_LIB_DEBUG
//#include "lib/TimeCounter.h"
#include "../lib/Profiler.h"
#include "Poco/Message.h"
#endif //_UNI_LIB_DEBUG



namespace UniLib {
	namespace controller {
		CPUShedulerThread::CPUShedulerThread(CPUSheduler* parent, const char* name)
			: Thread(name), mParent(parent)
#ifdef _UNI_LIB_DEBUG
			, mSpeedLog(Poco::Logger::get("SpeedLog"))
#endif
		{
#ifdef _UNI_LIB_DEBUG
			mName = name;
#endif
			mWaitingTask = mParent->getNextUndoneTask(this);

		}

		CPUShedulerThread::~CPUShedulerThread()
		{
		}

		int CPUShedulerThread::ThreadFunction()
		{
			Poco::Logger& errorLog = Poco::Logger::get("errorLog");
			static const char* function_name = "CPUShedulerThread::ThreadFunction";
			while(!mWaitingTask.isNull())
			{
				
#ifdef _UNI_LIB_DEBUG
				Profiler counter;
				//debug::CPUShedulerTasksLog* l = debug::CPUShedulerTasksLog::getInstance();
				std::string name = mWaitingTask->getName();
				//l->addTaskLogEntry((HASH)mWaitingTask.getResourcePtrHolder(), mWaitingTask->getResourceType(), mName.data(), name);
#endif 
				try {
					int returnValue = mWaitingTask->run();
					if (!returnValue) {
						mWaitingTask->setTaskFinished();
					}
#ifdef _UNI_LIB_DEBUG
					//l->removeTaskLogEntry((HASH)mWaitingTask.getResourcePtrHolder());
					mSpeedLog.information("%s used on thread: %s by Task: %s of: %s (returned: %d)",
						counter.string(), mName, std::string(mWaitingTask->getResourceType()), name, returnValue);
#endif
				}
				catch (Poco::NullPointerException& ex) {
					//printf("[CPUShedulerThread::ThreadFunction] Null Pointer Exception for Task type: %s\n", mWaitingTask->getResourceType());			
					errorLog.error("[%s] Null Pointer Exception for Task type %s: %s", function_name, mWaitingTask->getResourceType(), ex.displayText());
				}
				catch (Poco::Exception& ex) {
					errorLog.error("[%s]  Exception for Task type %s: %s", function_name, mWaitingTask->getResourceType(), ex.displayText());
				}
				catch (std::exception& ex) {
					std::string exception_message = ex.what();
					errorLog.error("[%s] std::exception for task type %s: %s", function_name, mWaitingTask->getResourceType(), exception_message);
				}

				mWaitingTask = mParent->getNextUndoneTask(this);
			}
			return 0;
		}

		void CPUShedulerThread::setNewTask(TaskPtr cpuTask)
		{
			threadLock();
			mWaitingTask = cpuTask;
			threadUnlock();
			condSignal();
		}
	}
}