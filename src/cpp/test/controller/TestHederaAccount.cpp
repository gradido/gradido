#include "TestHederaAccount.h"
#include "../SingletonManager/ConnectionManager.h"
namespace controller {

	void TestHederaAccount::SetUp()
	{
		
	}
		
	TEST_F(TestHederaAccount, TestPick) {
		auto hedera_account = controller::HederaAccount::pick(model::table::HEDERA_TESTNET, false);
		EXPECT_FALSE(hedera_account.isNull());
	}
}