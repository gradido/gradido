#include "Task.h"


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
			if (mParentTaskPtrArraySize) {
				delete[] mParentTaskPtrArray;
			}
			if (mFinishCommand) {
				delete mFinishCommand;
			}
            mParentTaskPtrArraySize = 0;
			mWorkingMutex.lock();
            mDeleted = true;
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
			mReferenceCount++;
		}

		void Task::release()
		{
			mReferenceCount--;
			if (0 == mReferenceCount) {
				delete this;
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