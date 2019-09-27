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

/**
 * @Author Dario Rekowski
 * 
 * @Date 13.08.12
 * 
 * @Desc Class for easy handling threading
 */
 
#ifndef __DR_UNIVERSUM_LIB_THREAD__
#define __DR_UNIVERSUM_LIB_THREAD__

//#include "Timer.h"
//#include <sdl/SDL_thread.h>
#include "Poco/Thread.h"
#include "Poco/Mutex.h"
#include "Poco/Semaphore.h"
#include "Poco/Condition.h"

namespace UniLib {
    namespace lib {
        class Thread : public Poco::Runnable
        {
        public:
            //! \param threadName used since SDL 1.3, for BeOS max. 32, for Linux max 16, for Visual Studio 6.0 max 9 char
			//! \param createInConstructor set to false if thread shouldn't create in constructor, for example if SDL isn't loaded yet
            Thread(const char* threadName = NULL, bool createInConstructor = true);
            virtual ~Thread();

            inline void threadLock() {mutex.lock();}
			inline void threadUnlock() {mutex.unlock();}
            // signal data chance, will continue thread, if he is paused
            int condSignal();

			//! \param threadName used since SDL 1.3, for BeOS max. 32, for Linux max 16, for Visual Studio 6.0 max 9 char
			int init(const char* threadName);

			void run();
        protected:
            //! \brief will be called every time from thread, when condSignal was called
            //! will be called from thread with locked working mutex,<br>
            //! mutex will be unlock after calling this function
            //! \return if return isn't 0, thread will exit
            virtual int ThreadFunction() = 0;

            

            Poco::Mutex		   mutex;
            Poco::Thread*      mPocoThread;
            Poco::Condition	   condition;
            Poco::Semaphore	   semaphore;
            bool               exitCalled;
        };

    }
}


#endif //__DR_UNIVERSUM_LIB_THREAD__
