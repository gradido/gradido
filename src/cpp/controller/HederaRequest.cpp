#include "HederaRequest.h"
#include "../proto/hedera/CryptoService.grpc.pb.h"
#include "../proto/hedera/ConsensusService.grpc.pb.h"

#include "../lib/DataTypeConverter.h"

#include <grpc/grpc.h>
#include <grpcpp/channel.h>
#include <grpcpp/client_context.h>
#include <grpcpp/create_channel.h>
#include <chrono>


HederaRequest::HederaRequest()
{

}

HederaRequest::~HederaRequest()
{

}

HederaRequestReturn HederaRequest::request(model::hedera::Query* query, model::hedera::Response* response, Poco::UInt64 fee/* = 0*/)
{
	auto channel = grpc::CreateChannel(query->getConnectionString(), grpc::InsecureChannelCredentials());
	
	grpc::ClientContext context;
	std::chrono::system_clock::time_point deadline = std::chrono::system_clock::now() +
		std::chrono::milliseconds(5000);
	context.set_deadline(deadline);
	//grpc::CompletionQueue cq;

	auto proto_query = query->getProtoQuery();
	
	auto proto_query_serialized = proto_query->SerializeAsString();
	//auto query_hex_string = DataTypeConverter::binToHex((unsigned char*)proto_query_serialized.data(), proto_query_serialized.size());
	//printf("[HederaRequest::request] query as hex: %s\n", query_hex_string.data());
	
	auto proto_response = response->getResponsePtr();
	auto connect_string = query->getConnectionString();

	grpc::Status status;
	std::string queryName;

	if (proto_query->has_cryptogetaccountbalance()) 
	{
		auto stub = proto::CryptoService::NewStub(channel);	
		// crypto account get balance currently hasn't fees
		query->setResponseType(proto::ANSWER_ONLY);
		
		queryName = "crypte get balance";
		status = stub->cryptoGetBalance(&context, *proto_query, proto_response);
		
	}
	else if (proto_query->has_consensusgettopicinfo()) 
	{
		auto stub = proto::ConsensusService::NewStub(channel);
		
		queryName = "consensus topic get info";
		status = stub->getTopicInfo(&context, *proto_query, proto_response);

	}
	else if (proto_query->has_transactiongetreceipt()) {
		auto stub = proto::CryptoService::NewStub(channel);

		queryName = "crypto transaction get receipt";
		status = stub->getTransactionReceipts(&context, *proto_query, proto_response);
	}
	if (status.ok()) 
	{
		auto response_code = response->getResponseCode();
		if (response_code) {
			addError(new ParamError("Hedera Request", "precheck code: ", proto::ResponseCodeEnum_Name(response_code)));
			return HEDERA_REQUEST_PRECHECK_ERROR;
		}
		else {
			return HEDERA_REQUEST_RETURN_OK;
		}
		
	}
	else if("" != queryName) 
	{
		addError(new ParamError("Hedera Request", "query name: ", queryName));
		addError(new ParamError("Hedera Request", "error message: ", status.error_message()));
		addError(new ParamError("Hedera Request", "details: ", status.error_details()));
		return HEDERA_REQUEST_RETURN_ERROR;
	}
	return HEDERA_REQUEST_UNKNOWN_QUERY;
}


HederaRequestReturn HederaRequest::request(model::hedera::Transaction* transaction, model::hedera::Response* response)
{
	auto channel = grpc::CreateChannel(transaction->getConnectionString(), grpc::InsecureChannelCredentials());

	grpc::ClientContext context;
	std::chrono::system_clock::time_point deadline = std::chrono::system_clock::now() +
		std::chrono::milliseconds(5000);
	context.set_deadline(deadline);

	return HEDERA_REQUEST_RETURN_OK;
}

HederaRequestReturn HederaRequest::request(model::hedera::Transaction* transaction, HederaTask* task)
{
	assert(transaction && task);
	auto channel = grpc::CreateChannel(transaction->getConnectionString(), grpc::InsecureChannelCredentials());

	grpc::ClientContext context;
	std::chrono::system_clock::time_point deadline = std::chrono::system_clock::now() +
		std::chrono::milliseconds(5000);
	context.set_deadline(deadline);
	auto transaction_type = transaction->getType();
	task->setTransactionId(transaction->getTransactionId());
	if (model::hedera::TRANSACTION_CONSENSUS_SUBMIT_MESSAGE == transaction_type ||
		model::hedera::TRANSACTION_CONSENSUS_CREATE_TOPIC == transaction_type) {
		auto stub = proto::ConsensusService::NewStub(channel);
		grpc::Status status;
		std::string service_name;
		if (model::hedera::TRANSACTION_CONSENSUS_SUBMIT_MESSAGE == transaction_type) {
			status = stub->submitMessage(&context, *transaction->getTransaction(), task->getTransactionResponse()->getProtoResponse());
			service_name = "submitMessage";
		}
		else if (model::hedera::TRANSACTION_CONSENSUS_CREATE_TOPIC == transaction_type) {
			status = stub->createTopic(&context, *transaction->getTransaction(), task->getTransactionResponse()->getProtoResponse());
			service_name = "createTopic";
		}
		if (status.ok()) {
			return HEDERA_REQUEST_RETURN_OK;
		}
		else {
			addError(new ParamError("Hedera Request", "consensus service error message:", status.error_message()));
			addError(new ParamError("Hedera Request", "service name", service_name));
			addError(new ParamError("Hedera Request", "details: ", status.error_details()));
			return HEDERA_REQUEST_RETURN_ERROR;
		}
	}
	
	addError(new ParamError("Hedera Request", "not implementet or unknown transaction type", transaction_type));
	return HEDERA_REQUEST_UNKNOWN_TRANSACTION;
}

#include "Poco/JSON/Object.h"
#include "../lib/JsonRequest.h"

HederaRequestReturn HederaRequest::requestViaPHPRelay(model::hedera::Query* query)
{
	JsonRequest phpRelay("***REMOVED***", 88);
	Poco::Net::NameValueCollection parameters;
	std::string query_string = query->getProtoQuery()->SerializeAsString();
	//auto query_base64 = DataTypeConverter::binToBase64((const unsigned char*)query_string.data(), query_string.size(), sodium_base64_VARIANT_URLSAFE_NO_PADDING);
	//auto findPos = query_string.find_first_of("\u");
	auto query_hex = DataTypeConverter::binToHex((const unsigned char*)query_string.data(), query_string.size());
	parameters.set("content", query_hex.substr(0, query_hex.size()-1));
	parameters.set("server", query->getConnectionString());
	parameters.set("method", "getBalance");
	parameters.set("service", "crypto");
	phpRelay.requestGRPCRelay(parameters);
	//phpRelay.request("")

	return HEDERA_REQUEST_RETURN_OK;	
}