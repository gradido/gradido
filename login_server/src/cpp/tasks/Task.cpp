#include "Task.h"
#include "../lib/NotificationList.h"

namespace UniLib {
	namespace controller {
		Task::Task() 
		: mTaskScheduled(false), mFinishCommand(nullptr), mParentTaskPtrArray(nullptr),
		  mParentTaskPtrArraySize(0), mDeleted(false), mFinished(false), mReferenceCount(1)
		{
		}

        Task::Task(size_t taskPointerArraySize)
            : mTaskScheduled(false), mFinishCommand(nullptr), mParentTaskPtrArray(new TaskPtr[taskPointerArraySize]), mParentTaskPtrArraySize(taskPointerArraySize),
             mDeleted(false), mFinished(false), mReferenceCount(1)
        {
        }
		
		Task::~Task()
		{
			mWorkingMutex.lock();
			//printf("[Task::~Task]\n");
			if (mParentTaskPtrArraySize) {
				delete[] mParentTaskPtrArray;
			}
			if (mFinishCommand) {
				delete mFinishCommand;
			}
            mParentTaskPtrArraySize = 0;
			
            mDeleted = true;
			//printf("[Task::~Task] finished\n");
			mWorkingMutex.unlock();
			
		}

        bool Task::isAllParentsReady()
        {
            bool allFinished = true;
			lock();
            for(size_t i = 0; i < mParentTaskPtrArraySize; i++) {
                TaskPtr task = mParentTaskPtrArray[i];
				if (!task.isNull() && !task->isTaskFinished()) {
                    allFinished = false;
                    if(!task->isTaskSheduled()) 
                        mParentTaskPtrArray[i]->scheduleTask(mParentTaskPtrArray[i]);
                }
            }
			unlock();
            return allFinished;
        }

		TaskPtr Task::getParent(int index)
		{
			if (index < 0 || index >= mParentTaskPtrArraySize) {
				return nullptr;
			}
			return mParentTaskPtrArray[index];
		}

		void Task::duplicate()
		{
			Poco::Mutex::ScopedLock _lock(mReferenceMutex);
			//mReferenceMutex.lock();
			mReferenceCount++;
			//printf("[Task::duplicate] new value: %d\n", mReferenceCount);
			//mReferenceMutex.unlock();
		}

		void Task::release()
		{
			//mReferenceMutex.lock();
			Poco::Mutex::ScopedLock _lock(mReferenceMutex);
			mReferenceCount--;
			//printf("[Task::release] new value: %d\n", mReferenceCount);
			if (0 == mReferenceCount) {
				//mReferenceMutex.unlock();
				delete this;
				return;
			}
			//mReferenceMutex.unlock();

		}

		void Task::lock()
		{
			try {
				mWorkingMutex.lock(500);
			}
			catch (Poco::TimeoutException& ex) {
				NotificationList errors;
				errors.addError(new ParamError("Task::lock", getResourceType(), ex.displayText()));
				errors.sendErrorsAsEmail();
			}
		}

		void Task::setTaskFinished() {
			lock(); 
			mFinished = true; 
			if (mFinishCommand) {
				mFinishCommand->taskFinished(this);
			}
			unlock(); 
		}

	}
}