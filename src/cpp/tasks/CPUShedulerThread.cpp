#include "CPUShedulerThread.h"
#include "CPUSheduler.h"
#include "Task.h"
//#include "debug/CPUSchedulerTasksLog.h"

#ifdef _UNI_LIB_DEBUG
//#include "lib/TimeCounter.h"
#include "../model/Profiler.h"
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
			while(!mWaitingTask.isNull())
			{
				
#ifdef _UNI_LIB_DEBUG
				Profiler counter;
				//debug::CPUShedulerTasksLog* l = debug::CPUShedulerTasksLog::getInstance();
				const char* name = mWaitingTask->getName();
				//l->addTaskLogEntry((HASH)mWaitingTask.getResourcePtrHolder(), mWaitingTask->getResourceType(), mName.data(), name);
#endif 
				if (!mWaitingTask->run()) {
					mWaitingTask->setTaskFinished();
				}
#ifdef _UNI_LIB_DEBUG
				//l->removeTaskLogEntry((HASH)mWaitingTask.getResourcePtrHolder());
				mSpeedLog.information("%s used on thread: %s by Task: %s of: %s",
					counter.string(), mName, mWaitingTask->getResourceType(), name);
#endif
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