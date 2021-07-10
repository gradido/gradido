#include "TestSendMessage.h"


#include "SingletonManager/MemoryManager.h"
#include "lib/Profiler.h"
#include "Poco/Thread.h"
#ifdef _WIN32
#include "iota_client.h"
#else
#include "client/api/v1/send_message.h"
#endif

void TestSendMessage::SetUp()
{
#ifdef __linux__
    std::string iota_host = "api.lb-0.testnet.chrysalis2.com";
    strcpy(mIotaClientConfig.host, iota_host.data());
    mIotaClientConfig.port = 443;
    mIotaClientConfig.use_tls = true;
#endif
}

TEST_F(TestSendMessage, SendIotaMessage)
{
	std::string message_begin = "Gradido Transaktion from Login-Server, ";
	srand(time(NULL));

	std::string index = "GRADIDO.gdd1";

#ifdef _WIN32
	auto mm = MemoryManager::getInstance();
	auto message_id = mm->getFreeMemory(32);
#else
    int err = 0;
    res_send_message_t res = {};

#endif
	Profiler timeUsed;
	int i = 0;
	for (; i < 4; i++) {
		std::string message = message_begin += std::to_string(rand());
#ifdef _WIN32
		sendIotaMessage((const unsigned char*)message.data(), message.size(), (const unsigned char*)index.data(), index.size(), *message_id);
#else
        // send out index
        err = send_indexation_msg(&mIotaClientConfig, index.data(), message.data(), &res);
        if (res.is_error) {
            printf("Err response: %s\n", res.u.error->msg);
            res_err_free(res.u.error);
        }

        if (err) {
            printf("send indexation failed\n");
        } else {
            printf("message ID: %s\n", res.u.msg_id);
        }
#endif
	}

	printf("time for sending %d message with iota: %s\n", i, timeUsed.string().data());

	//Poco::Thread::sleep(10000);
#ifdef _WIN32
	mm->releaseMemory(message_id);
#endif
}
