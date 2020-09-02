#include "HederaRequest.h"
#include "../proto/hedera/CryptoService.grpc.pb.h"

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

HederaRequestReturn HederaRequest::request(model::hedera::Query* query)
{
	auto channel = grpc::CreateChannel(query->getConnectionString(), grpc::InsecureChannelCredentials());
	grpc::ClientContext context;
	std::chrono::system_clock::time_point deadline = std::chrono::system_clock::now() +
		std::chrono::milliseconds(10000);
	context.set_deadline(deadline);
	grpc::CompletionQueue cq;

	auto proto_query = query->getProtoQuery();
	auto proto_query_serialized = proto_query->SerializeAsString();
	auto query_hex_string = DataTypeConverter::binToHex((unsigned char*)proto_query_serialized.data(), proto_query_serialized.size());
	printf("[HederaRequest::request] query as hex: %s\n", query_hex_string.data());
	proto::Response* response = nullptr;
	if (proto_query->has_cryptogetaccountbalance()) {
		auto stub = proto::CryptoService::NewStub(channel);
		auto connect_string = query->getConnectionString();
		printf("try connection to hedera with: %s\n", connect_string.data());
		//auto stream = stub->PrepareAsynccryptoGetBalance(&context, *proto_query, &cq);
		auto status = stub->cryptoGetBalance(&context, *proto_query, response);
		//stream->StartCall();
		addError(new ParamError("Hedera Request", "crypto get balance", status.error_message()));
		printf("[HederaRequest::request] error details: %s\n", status.error_details().data());
	}
	return HEDERA_REQUEST_RETURN_OK;
}