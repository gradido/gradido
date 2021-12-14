#include "JsonPackTransaction.h"

#include "../controller/User.h"

#include "../lib/DataTypeConverter.h"

#include "../model/gradido/Transaction.h"

Poco::JSON::Object* JsonPackTransaction::handle(Poco::Dynamic::Var params)
{	
	std::string transaction_type;
	
	// if is json object
	if (params.type() == typeid(Poco::JSON::Object::Ptr)) {
		Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
		/// Throws a RangeException if the value does not fit
		/// into the result variable.
		/// Throws a NotImplementedException if conversion is
		/// not available for the given type.
		/// Throws InvalidAccessException if Var is empty.
		try {
			paramJsonObject->get("transactionType").convert(transaction_type);
			auto memoObj = paramJsonObject->get("memo");
			if (!memoObj.isEmpty()) {
				memoObj.convert(mMemo);
			}
			paramJsonObject->get("created").convert(mCreated);
		}
		catch (Poco::Exception& ex) {
			return stateError("json exception", ex.displayText());
		}
	}
	else {
		return stateError("parameter format unknown");
	}
	
	if (transaction_type == "transfer") {
		return transfer(params);
	}
	else if (transaction_type == "creation") {
		return creation(params);
	}
	else if (transaction_type == "groupMemberUpdate") {
		return groupMemberUpdate(params);
	}

	return stateError("transaction_type unknown");

}

Poco::JSON::Object* JsonPackTransaction::transfer(Poco::Dynamic::Var params)
{
	/*
	* 
	{
		"senderPubkey":"131c7f68dd94b2be4c913400ff7ff4cdc03ac2bda99c2d29edcacb3b065c67e6",
		"recipientPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
		"amount": 1000000,
		"senderGroupAlias": "gdd1",
		"recipientGroupAlias":"gdd2"
	}
	*/
	std::string senderPubkey, recipientPubkey, senderGroupAlias, recipientGroupAlias;
	Poco::Int64 amount = 0;

	Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
	/// Throws a RangeException if the value does not fit
	/// into the result variable.
	/// Throws a NotImplementedException if conversion is
	/// not available for the given type.
	/// Throws InvalidAccessException if Var is empty.
	try {
		paramJsonObject->get("senderPubkey").convert(senderPubkey);
		paramJsonObject->get("recipientPubkey").convert(recipientPubkey);
		paramJsonObject->get("amount").convert(amount);
		auto senderGroupAliasObj = paramJsonObject->get("senderGroupAlias");
		auto recipientGroupAliasObj = paramJsonObject->get("recipientGroupAlias");
		if (!senderGroupAliasObj.isEmpty()) {
			senderGroupAliasObj.convert(senderGroupAlias);
		}
		if (!recipientGroupAliasObj.isEmpty()) {
			recipientGroupAliasObj.convert(recipientGroupAlias);
		}
	}
	catch (Poco::Exception& ex) {
		return stateError("json exception", ex.displayText());
	}

	auto mm = MemoryManager::getInstance();
	auto senderPubkeyBin = DataTypeConverter::hexToBin(senderPubkey);
	auto recipientPubkeyBin = DataTypeConverter::hexToBin(recipientPubkey);

	std::vector<TransactionGroupAlias> transactions;
	if (senderGroupAlias.size() && recipientGroupAlias.size()) {
		auto transactionArray = model::gradido::Transaction::createTransferCrossGroup(senderPubkeyBin, recipientPubkeyBin, amount, mMemo, senderGroupAlias, recipientGroupAlias);
		transactions.push_back({ transactionArray[0], senderGroupAlias }); // outbound
		transactions.push_back({ transactionArray[1], recipientGroupAlias }); // inbound
	}
	else {
		auto transaction = model::gradido::Transaction::createTransferLocal(senderPubkeyBin, recipientPubkeyBin, amount, mMemo);
		transactions.push_back({ transaction, "" });
	}

	mm->releaseMemory(senderPubkeyBin);
	mm->releaseMemory(recipientPubkeyBin);
	
	return resultBase64Transactions(transactions);
}
Poco::JSON::Object* JsonPackTransaction::creation(Poco::Dynamic::Var params)
{
	/*
	*
	{
		"transactionType": "creation",
		"created":"2021-01-10 10:00:00",
		"memo": "AGE September 2021",
		"recipientPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
		"amount": 10000000,
		"targetDate": "2021-09-01 01:00:00",
	}
	*/
	std::string recipientPubkey;
	Poco::Int64 amount = 0;
	Poco::DateTime targetDate;

	Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
	/// Throws a RangeException if the value does not fit
	/// into the result variable.
	/// Throws a NotImplementedException if conversion is
	/// not available for the given type.
	/// Throws InvalidAccessException if Var is empty.
	try {
		paramJsonObject->get("recipientPubkey").convert(recipientPubkey);
		paramJsonObject->get("amount").convert(amount);
		paramJsonObject->get("targetDate").convert(targetDate);
	}
	catch (Poco::Exception& ex) {
		return stateError("json exception", ex.displayText());
	}

	auto mm = MemoryManager::getInstance();
	auto recipientPubkeyBin = DataTypeConverter::hexToBin(recipientPubkey);

	std::vector<TransactionGroupAlias> transactions;
	transactions.push_back({ model::gradido::Transaction::createCreation(recipientPubkeyBin, amount, targetDate, mMemo), "" });
	mm->releaseMemory(recipientPubkeyBin);

	return resultBase64Transactions(transactions);

}
Poco::JSON::Object* JsonPackTransaction::groupMemberUpdate(Poco::Dynamic::Var params)
{
	/*
	*
	{
		"transactionType": "groupMemberUpdate",
		"created":"2021-01-10 10:00:00",
		"userRootPubkey":"eff7a4a440eb10fa6d5ae5ee47d63240c55ea3e1972e9815c09411e25ab09fdd",
		"currentGroupAlias": "gdd1",
		"newGroupAlias":"gdd2"
	}
	*/
	std::string userRootPubkey;
	std::string currentGroupAlias, newGroupAlias;

	Poco::JSON::Object::Ptr paramJsonObject = params.extract<Poco::JSON::Object::Ptr>();
	/// Throws a RangeException if the value does not fit
	/// into the result variable.
	/// Throws a NotImplementedException if conversion is
	/// not available for the given type.
	/// Throws InvalidAccessException if Var is empty.
	try {
		paramJsonObject->get("userRootPubkey").convert(userRootPubkey);
		auto currentGroupAliasObj = paramJsonObject->get("currentGroupAlias");
		auto newGroupAliasObj = paramJsonObject->get("newGroupAlias");
		if (!currentGroupAliasObj.isEmpty()) {
			currentGroupAliasObj.convert(currentGroupAlias);
		}
		if (!newGroupAliasObj.isEmpty()) {
			newGroupAliasObj.convert(newGroupAlias);
		}
	}
	catch (Poco::Exception& ex) {
		return stateError("json exception", ex.displayText());
	}

	auto mm = MemoryManager::getInstance();

	auto userRootPubkeyBin = DataTypeConverter::hexToBin(userRootPubkey);

	std::vector<TransactionGroupAlias> transactions;
	if (currentGroupAlias.size() && newGroupAlias.size()) {
		auto transactionArray = model::gradido::Transaction::createGroupMemberUpdateMove(userRootPubkeyBin, currentGroupAlias, newGroupAlias);
		transactions.push_back({ transactionArray[0], currentGroupAlias }); // outbound
		transactions.push_back({ transactionArray[1], newGroupAlias }); // inbound
	}
	else {
		transactions.push_back({ model::gradido::Transaction::createGroupMemberUpdateAdd(userRootPubkeyBin), "" });
	}
	mm->releaseMemory(userRootPubkeyBin);

	return resultBase64Transactions(transactions);

}


Poco::JSON::Object* JsonPackTransaction::resultBase64Transactions(std::vector<TransactionGroupAlias> transactions)
{
	Poco::JSON::Array transactionsJsonArray;
	for (auto it = transactions.begin(); it != transactions.end(); it++) {
		auto transactionBody = it->first->getTransactionBody();
		transactionBody->setCreated(mCreated);
		auto result = transactionBody->getTransactionBase()->validate();
		if (result != model::gradido::TRANSACTION_VALID_OK) {
			return stateError("invalid transaction", transactionBody->getTransactionBase());
		}
		Poco::JSON::Object entry;
		if (it->second.size()) {
			entry.set("groupAlias", it->second);
		}
		try {
			std::string base64 = DataTypeConverter::binToBase64(transactionBody->getBodyBytes());
			if (base64 != "<uninitalized>") {
				entry.set("bodyBytesBase64", base64);
			}
			else {
				return stateError("invalid body bytes");
			}
			transactionsJsonArray.add(entry);
		}
		catch (Poco::Exception& ex) {
			return stateError("exception in serializing", ex.what());
		}

	}
	Poco::JSON::Object* result = stateSuccess();
	result->set("transactions", transactionsJsonArray);
	return result;
}