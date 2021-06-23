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

 \brief Container Wrapper class for mutex protected container
   changed to poco mutex for gradido login server
   default mutex from poco is recursive so it is some heavy thing

 \author Dario Rekowski

 \date 08.10.2015
*/

#ifndef __DR_UNIVERSUM_LIB_LIB_MULTITHREAD_CONTAINER_H__
#define __DR_UNIVERSUM_LIB_LIB_MULTITHREAD_CONTAINER_H__

//#include "UniversumLib.h"
#include "Poco/Mutex.h"

namespace UniLib {
	namespace lib {
		class MultithreadContainer
		{
		public:

			void lock(const char* stackDetails = nullptr);
			// \return false if mutex was locked from another thread
			bool tryLock();

			inline void unlock() { mWorkMutex.unlock(); mLastSucceededLock = ""; }

			inline const std::string& getLastSucceededLock() { return mLastSucceededLock; }
		protected:
			mutable Poco::Mutex mWorkMutex;
		private:
			std::string mLastSucceededLock;
		};
	}
}

#endif //__DR_UNIVERSUM_LIB_LIB_MULTITHREAD_CONTAINER_H__
