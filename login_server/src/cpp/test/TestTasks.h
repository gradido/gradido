#ifndef __GRADIDO_LOGIN_SERVER_TEST_TASKS_
#define __GRADIDO_LOGIN_SERVER_TEST_TASKS_

#include "Test.h"
#include <map>

#include "../tasks/CPUSheduler.h"
#include "../tasks/CPUTask.h"

#include "../lib/MultithreadContainer.h"

enum RandomCPUTaskType {
	RANDOM_CPU_TASK_CALCULATE,
	RANDOM_CPU_TASK_SLEEP
};
class TestTasks;

class RandomCPUTask : public UniLib::controller::CPUTask
{
public: 
	RandomCPUTask(UniLib::controller::CPUSheduler* scheduler, TestTasks* parent, int nr);
	virtual ~RandomCPUTask();

	int run();

	const char* getResourceType() const { return "RandomCPUTask"; };
	const char* getName() const;


protected:
	TestTasks* mParent;
	RandomCPUTaskType mType;
	Poco::UInt32 mHeaviness;
	int mNr;
};

class TestTasks : public Test, public UniLib::lib::MultithreadContainer
{
public:
	TestTasks();
	virtual ~TestTasks();

	int init();
	int test();
	inline const char* getName() { return "TestTasks"; }

	void releaseTask(int nr);

protected:
	UniLib::controller::CPUSheduler mTaskScheduler;
	std::map<int, RandomCPUTask*> mTasks;

	std::vector<std::string> mErrors;
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_TASKS_