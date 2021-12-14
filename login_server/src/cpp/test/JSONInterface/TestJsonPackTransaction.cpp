
#include "gtest/gtest.h"

#include "JSONInterface/JsonPackTransaction.h"
#include "lib/DataTypeConverter.h"
#include "TestJsonPackTransaction.h"

#include "Poco/DateTimeFormatter.h"
#include "proto/gradido/TransactionBody.pb.h"


void TestJsonPackTransaction::SetUp()
{
	
}

void TestJsonPackTransaction::TearDown()
{
	
}

/*
{
	"state": "success",
	"transactions": [
		{
			"bodyBytesBase64": "ChdEYW5rZSBmw7xyIGRlaW5lIEhpbGZlIRIGCKCg6/8FMkwKSgomCiATHH9o3ZSyvkyRNAD/f/TNwDrCvamcLSntyss7Blxn5hCAiXoSIO/3pKRA6xD6bVrl7kfWMkDFXqPhly6YFcCUEeJasJ/d"
		}
	]
}
*/

TEST_F(TestJsonPackTransaction, LocalTransfer)
{
	Poco::JSON::Object::Ptr params = new Poco::JSON::Object;
	params->set("transactionType", "transfer");
	Poco::DateTime now;
	std::string memo = "Danke fuer deine Hilfe!";
	params->set("created", Poco::DateTimeFormatter::format(now, "%Y-%m-%d %H:%M:%S"));
	params->set("memo", memo);
	params->set("senderPubkey", "131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6");
	params->set("recipientPubkey", "eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd");
	params->set("amount", 1000000);
	
	JsonPackTransaction jsonCall;
	auto result = jsonCall.handle(params);

	auto state = result->get("state");
	ASSERT_FALSE(state.isEmpty());
	ASSERT_TRUE(state.isString());
	ASSERT_EQ(state.toString(), "success");

	auto transactions = result->get("transactions");
	ASSERT_FALSE(transactions.isEmpty());
	ASSERT_TRUE(transactions.isArray());
	auto transaction = transactions.begin();
	ASSERT_FALSE(transaction->isEmpty());
	Poco::JSON::Object::Ptr object = result->extract<Poco::JSON::Object::Ptr>();
	Poco::DynamicStruct ds = *object;

	std::string base64BodyBytes = ds["transactions"][0]["bodyBytesBase64"];

	auto bodyBytes = DataTypeConverter::base64ToBin(base64BodyBytes);

	proto::gradido::TransactionBody protoBody;
	ASSERT_TRUE(protoBody.ParseFromString(std::string((const char*)bodyBytes->data(), bodyBytes->size())));
	ASSERT_TRUE(protoBody.has_transfer());
	auto nowRead = DataTypeConverter::convertFromProtoTimestampSeconds(protoBody.created());
	ASSERT_EQ(now.timestamp(), nowRead);
	ASSERT_EQ(memo, protoBody.memo());

	MemoryManager::getInstance()->releaseMemory(bodyBytes);

	delete result;
}