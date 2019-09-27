//#include "lib/Thread.h"
//#include "UniversumLib.h"
#include "Thread.h"

namespace UniLib {
    namespace lib {

        Thread::Thread(const char* threadName/* = NULL*/, bool createInConstructor/* = true*/)
            : mPocoThread(nullptr), semaphore(1), exitCalled(false)
        {
			if (createInConstructor) init(threadName);
        } 

		int Thread::init(const char* threadName)
		{
			semaphore.wait();
			mPocoThread = new Poco::Thread(threadName);
			mPocoThread->start(*this);
			return 0;
		}

        Thread::~Thread()
        {
            if(mPocoThread)
            {
                //Post Exit to Thread
                exitCalled = true;
				semaphore.wait();
                
                condSignal();
                //SDL_Delay(500);
				mPocoThread->join();
                //SDL_WaitThread(thread, NULL);
                //LOG_WARNING_SDL();
				delete mPocoThread;

				mPocoThread = nullptr;
            }
        }

        int Thread::condSignal()
        {
			condition.signal();
            /*if(SDL_CondSignal(condition)== -1) //LOG_ERROR_SDL(DR_ERROR);
            {
                LOG_WARNING("Fehler beim Aufruf von SDL_CondSignal"); 
                LOG_ERROR_SDL(DR_ERROR);
            }*/
            return 0;
        }

        void Thread::run()
        {
            //Thread* t = this;
			while (true) {
				try {
					semaphore.tryWait(100);
					printf("[Thread::%s] end worker thread\n", __FUNCTION__);
					break;
				} catch (Poco::TimeoutException& e) {

					if (exitCalled) return;
					// Lock work mutex
					threadLock();
					//int status = SDL_CondWait(t->condition, t->mutex);
					try {
						condition.wait(mutex);
						if (exitCalled) return;
						int ret = ThreadFunction();
						threadUnlock();
						if (ret)
						{
							//EngineLog.writeToLog("error-code: %d", ret);
							printf("[Thread::%s] error running thread functon: %d, exit thread\n", __FUNCTION__, ret);
							return;
						}
					}
					catch (Poco::Exception& e) {
						//unlock mutex and exit
						threadUnlock();
						//LOG_ERROR("Fehler in Thread, exit", -1);
						printf("[Thread::%s] exception: %s\n", __FUNCTION__, e.message().data());
						return;
					}	
				
				}
				catch (Poco::Exception& e) {
					printf("[Thread::%s] exception: %s\n", __FUNCTION__, e.message().data());
					return;
				}
			}
     
        }
    }
}