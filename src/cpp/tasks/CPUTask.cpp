#include "CPUTask.h"
#include "CPUSheduler.h"
#include "../ServerConfig.h"

namespace UniLib {
	namespace controller {
		CPUTask::CPUTask(CPUSheduler* cpuScheduler, size_t taskDependenceCount)
			: Task(taskDependenceCount), mScheduler(cpuScheduler)
		{
			assert(cpuScheduler);
		}

		CPUTask::CPUTask(CPUSheduler* cpuScheduler)
			: Task(), mScheduler(cpuScheduler)
		{
			assert(cpuScheduler);
		}

		CPUTask::CPUTask(size_t taskDependenceCount/* = 0*/)
			: Task(), mScheduler(ServerConfig::g_CPUScheduler)
		{
			assert(mScheduler);
		}

		CPUTask::~CPUTask()
		{

		}

		void CPUTask::scheduleTask(TaskPtr own)
		{
			assert(mScheduler);
			if(!isTaskSheduled()) {
				mScheduler->sheduleTask(own);
				taskScheduled();
			}
		}
	}
}
