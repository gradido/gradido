/*/*************************************************************************
*                                                                         *
* UniversumLib, collection of classes for generating and go through a     *
* whole universe. It is for my Gameproject Spacecraft					   *
* Copyright (C) 2014, 2015, 2016, 2017 Dario Rekowski.					   *
* Email: ***REMOVED***   Web: ***REMOVED***                *
*                                                                         *
* This program is free software: you can redistribute it and/or modify    *
* it under the terms of the GNU General Public License as published by    *
* the Free Software Foundation, either version 3 of the License, or       *
* any later version.													   *
*																		   *
* This program is distributed in the hope that it will be useful,	       *
* but WITHOUT ANY WARRANTY; without even the implied warranty of	       *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the	       *
* GNU General Public License for more details.							   *
*																		   *
* You should have received a copy of the GNU General Public License	   *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.   *
*                                                                         *
***************************************************************************/
/*!
 *
 * \author: Dario Rekowski
 * 
 * \date: 27.08.15
 *
 * \desc: Task save at the same time the result of his task and the way to get to the result
 */

#ifndef __DR_UNIVERSUM_LIB_CONTROLLER_TASK_H__
#define __DR_UNIVERSUM_LIB_CONTROLLER_TASK_H__


 //#include "UniversumLib.h"

#include "Poco/AutoPtr.h"
#include "Poco/Mutex.h"
#include <assert.h>


namespace UniLib {
    namespace controller {
	
		
        class Task;
        typedef Poco::AutoPtr<Task> TaskPtr;

		class Command {
		public:
			virtual int taskFinished(Task* task) = 0;
		};


        class Task
        {
        public:
            Task();
            Task(size_t parentTaskPointerArraySize);
            virtual ~Task();

			virtual bool isReady() { return isAllParentsReady(); }
            // called from scheduler
            //! \brief return true if all parent task finished or return false and schedule not already finished parent tasks
            bool isAllParentsReady();
            //! \brief return true if task has finished, else false
            //! automatic scheduling of task if he isn't finished and sheduled yet
			virtual bool isTaskFinished() { return false; }
            //! \brief called from task scheduler, maybe from another thread
            virtual int run() = 0;

			

			inline void lock() {mWorkingMutex.lock();}
			inline void unlock() {mWorkingMutex.unlock();}

            inline void setParentTaskPtrInArray(TaskPtr task, size_t index)
            {
                assert(index < mParentTaskPtrArraySize);
                mParentTaskPtrArray[index] = task;
            }
		/*	inline void setParentTaskPtrInArray(DRResourcePtrHolder* resourceHolder, size_t index) {
                assert(index < mParentTaskPtrArraySize);
                mParentTaskPtrArray[index] = resourceHolder;
            }*/

			inline void setFinishCommand(Command* command) {mFinishCommand = command;}

			// from parent
			virtual const char* getResourceType() const {return "Task";};
#ifdef _UNI_LIB_DEBUG
			virtual const char* getName() const { return mName.data(); }
			__inline__ void setName(const char* name) { mName = name; }
#else
			virtual const char* getName() const { return ""; }
#endif

			// type check

			virtual void scheduleTask(TaskPtr own) = 0;

			// for poco auto ptr
			void duplicate();
			void release();
        protected:
			// scheduling only once
			inline bool isTaskSheduled() {return mTaskScheduled;}
			inline void taskScheduled() {mTaskScheduled = true;}
			
			bool mTaskScheduled;
			Command*	mFinishCommand;
        private:
            TaskPtr* mParentTaskPtrArray;
            size_t   mParentTaskPtrArraySize; 
            Poco::Mutex mWorkingMutex;
            bool     mDeleted;
			// for poco auto ptr
			int mReferenceCount;
#ifdef _UNI_LIB_DEBUG
			std::string mName;
#endif
			
        };
    }
}

#endif __DR_UNIVERSUM_LIB_CONTROLLER_TASK_H__