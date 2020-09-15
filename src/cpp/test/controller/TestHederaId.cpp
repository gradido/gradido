#include "TestHederaId.h"
#include "../SingletonManager/ConnectionManager.h"
namespace controller {

	void TestHederaId::SetUp()
	{

	}

	TEST_F(TestHederaId, TestFindTopicId) {
		auto hedera_topic_id = controller::HederaId::find(1, model::table::HEDERA_TESTNET);
		EXPECT_FALSE(hedera_topic_id.isNull());
	}
}