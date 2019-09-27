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
 * \date: 27.09.15
 *
 * \desc: CPU Scheduler Thread, one of multiple threads of CPU Scheduler
 */

#ifndef __DR_UNIVERSUM_LIB_CONTROLLER_CPU_SHEDULER_THREAD_H__
#define __DR_UNIVERSUM_LIB_CONTROLLER_CPU_SHEDULER_THREAD_H__

#include "Thread.h"
#include "Poco/AutoPtr.h"

namespace UniLib {
    namespace controller {

		class  Task;
		typedef Poco::AutoPtr<Task> TaskPtr;
		class CPUSheduler;



        class  CPUShedulerThread : public lib::Thread
        {
        public: 
            CPUShedulerThread(CPUSheduler* parent, const char* name);			
            virtual ~CPUShedulerThread();
			
			//! \brief will be called every time from thread, when condSignal was called
			//! will be called from thread with locked working mutex,<br>
			//! mutex will be unlock after calling this function
			//! \return if return isn't 0, thread will exit
			virtual int ThreadFunction();

			void setNewTask(TaskPtr cpuTask);

#ifdef _UNI_LIB_DEBUG
			std::string getName() {return mName;}
#endif
        protected:
#ifdef _UNI_LIB_DEBUG
			std::string mName;
#endif
			
		private: 
			TaskPtr mWaitingTask;
			CPUSheduler* mParent;

        };
    }
}

#endif //__DR_UNIVERSUM_LIB_CONTROLLER_CPU_SHEDULER_THREAD_H__
        