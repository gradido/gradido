#ifndef __GRADIDO_LOGIN_SERVER_TEST_IOTA_TEST_SEND_MESSAGE_H

#include "gtest/gtest.h"
#ifdef __linux__
    #include "client/api/v1/send_message.h"
#endif
class TestSendMessage : public ::testing::Test {

protected:
	void SetUp() override;
#ifdef __linux__
    iota_client_conf_t mIotaClientConfig;
#endif
};

#endif //__GRADIDO_LOGIN_SERVER_TEST_IOTA_TEST_SEND_MESSAGE_H
