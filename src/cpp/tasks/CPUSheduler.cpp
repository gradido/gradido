#include "CPUSheduler.h"
#include "CPUShedulerThread.h"
#include "CPUTask.h"
#include <memory.h>

namespace UniLib {
	namespace controller {

		CPUSheduler::CPUSheduler(uint8_t threadCount, const char* name)
			: mThreads(new CPUShedulerThread*[threadCount]), mThreadCount(threadCount), mName(name)
		{
			char nameBuffer[10]; memset(nameBuffer, 0, 10);
			//uint8_t len = std:: min(strlen(name), 7);
			uint8_t len = strlen(name);
			if(len > 7) len = 7;
			memcpy(nameBuffer, name, len);
			for(int i = 0; i < threadCount; i++) {
				sprintf(&nameBuffer[len], "%.2d", i); 
				mThreads[i] = new CPUShedulerThread(this, nameBuffer);
			}
		}

		CPUSheduler::~CPUSheduler()
		{
			//printf("[CPUSheduler::~CPUSheduler]\n");
			for(int i = 0; i < mThreadCount; i++) {
				if (mThreads[i]) {
					delete mThreads[i];
				}
			}
			delete[] mThreads;
			mThreadCount = 0;
			//printf("[CPUSheduler::~CPUSheduler] finished\n");
		}

		int CPUSheduler::sheduleTask(TaskPtr task)
		{
			CPUShedulerThread* t = NULL;
			// look at free worker threads
			if(task->isAllParentsReady() && mFreeWorkerThreads.pop(t)) {
				// gave him the new task
				t->setNewTask(task);
			} else {
				// else put task to pending queue
				mPendingTasksMutex.lock();
				mPendingTasks.push_back(task);
				mPendingTasksMutex.unlock();
			}
			return 0;
		}
		TaskPtr CPUSheduler::getNextUndoneTask(CPUShedulerThread* Me)
		{
			// look at pending tasks
			TaskPtr task;
			mPendingTasksMutex.lock();
			for (std::list<TaskPtr>::iterator it = mPendingTasks.begin(); it != mPendingTasks.end(); it++) {
				if ((*it)->isAllParentsReady()) {
					task = *it;
					mPendingTasks.erase(it);
					mPendingTasksMutex.unlock();
					return task;
				}
			}
			mPendingTasksMutex.unlock();
			// push thread to worker queue
			if (Me) {
				mFreeWorkerThreads.push(Me);
			}
			
			return TaskPtr();
		}
		void CPUSheduler::checkPendingTasks()
		{
			TaskPtr task = getNextUndoneTask(NULL);
			if (!task.isNull()) {
				sheduleTask(task);
			}
		}

	}
}