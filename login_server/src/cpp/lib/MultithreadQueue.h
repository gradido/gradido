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
 
 \brief Container class for mutex protected queue

 \author Dario Rekowski

 \date 08.10.2015
*/

#ifndef _DR_UNIVERSUM_LIB_LIB_MULTITHREAD_QUEUE_H__
#define _DR_UNIVERSUM_LIB_LIB_MULTITHREAD_QUEUE_H__

#include "MultithreadContainer.h"
#include <queue>

namespace UniLib {
	namespace lib {
		template <class ResourceType>
		class MultithreadQueue: protected std::queue<ResourceType>, protected MultithreadContainer
		{
		public:
			virtual ~MultithreadQueue() {
				clear();
			}
			void clear() {
				lock();
				while (!std::queue<ResourceType>::empty()) std::queue<ResourceType>::pop();
				unlock();
			}
			void push(ResourceType val) 
			{
				lock();
				std::queue<ResourceType>::push(val);
				unlock();
			}
			bool empty()
			{
				bool result = false;
				lock();
				result = std::queue<ResourceType>::empty();
				unlock();
				return result;
			}
			//! \return false if no values are there
			//! \return true if value is there, gave val a copy from the value on top of queue
			bool pop(ResourceType& val) 
			{
				lock();
				if(!std::queue<ResourceType>::empty()) {
					val = std::queue<ResourceType>::front();
					std::queue<ResourceType>::pop();
					unlock();
					return true;
				}
				unlock();
				return false;
			}


		};

	}
}

#endif //_DR_UNIVERSUM_LIB_LIB_MULTITHREAD_QUEUE_H__