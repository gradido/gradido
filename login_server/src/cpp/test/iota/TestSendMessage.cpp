#include "gtest/gtest.h"
#include "iota_client.h"
#include "SingletonManager/MemoryManager.h"
#include "lib/Profiler.h"
#include "Poco/Thread.h"

TEST(TestSendMessage, SendIotaMessage)
{
	std::string message = "Gradido Transaktion from Login-Server, ";
	srand(time(NULL));
	message += std::to_string(rand());
	std::string index = "GRADIDO.gdd2";
	auto mm = MemoryManager::getInstance();
	auto message_id = mm->getFreeMemory(32);

	Profiler timeUsed;
	sendIotaMessage((const unsigned char*)message.data(), message.size(), (const unsigned char*)index.data(), index.size(), *message_id);
	printf("time for sending message with iota: %s\n", timeUsed.string().data());

	//Poco::Thread::sleep(10000);

	mm->releaseMemory(message_id);

}