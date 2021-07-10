#include "gtest/gtest.h"
#include "iota_client.h"
#include "SingletonManager/MemoryManager.h"
#include "lib/Profiler.h"
#include "Poco/Thread.h"

TEST(TestSendMessage, SendIotaMessage)
{
	std::string message_begin = "Gradido Transaktion from Login-Server, ";
	srand(time(NULL));
	
	std::string index = "GRADIDO.gdd1";
	auto mm = MemoryManager::getInstance();
	auto message_id = mm->getFreeMemory(32);

	Profiler timeUsed;
	int i = 0;
	for (; i < 4; i++) {
		std::string message = message_begin += std::to_string(rand());
		//sendIotaMessage((const unsigned char*)message.data(), message.size(), (const unsigned char*)index.data(), index.size(), *message_id);
	}
	
	printf("time for sending %d message with iota: %s\n", i, timeUsed.string().data());

	//Poco::Thread::sleep(10000);

	mm->releaseMemory(message_id);

}