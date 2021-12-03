#include "GradidoBlock.h"
#include <google/protobuf/util/json_util.h>
#include "proto/gradido/TransactionBody.pb.h"
#include "../../lib/DataTypeConverter.h"

#include "rapidjson/document.h"
#include "rapidjson/prettywriter.h"

using namespace rapidjson;

namespace model {
	namespace gradido {
		GradidoBlock::GradidoBlock(std::string serializedGradidoBlock)
		{
			mProtoGradidoBlock.ParseFromString(serializedGradidoBlock);
		}

		std::string GradidoBlock::toJson()
		{
			static const char* function_name = "Transaction::getTransactionAsJson";
			std::string json_message = "";
			std::string json_message_body = "";
			google::protobuf::util::JsonPrintOptions options;
			options.add_whitespace = true;
			options.always_print_primitive_fields = true;

			auto status = google::protobuf::util::MessageToJsonString(mProtoGradidoBlock, &json_message, options);
			if (!status.ok()) {
				return "error parsing gradido block: " + status.ToString();
			}
			proto::gradido::TransactionBody body;
			body.ParseFromString(mProtoGradidoBlock.transaction().body_bytes());
			status = google::protobuf::util::MessageToJsonString(body, &json_message_body, options);
			if (!status.ok()) {				
				return "error parsing transaction body: " + status.ToString();
			}
			//\"bodyBytes\": \"MigKIC7Sihz14RbYNhVAa8V3FSIhwvd0pWVvZqDnVA91dtcbIgRnZGQx\"
			int startBodyBytes = json_message.find("bodyBytes") + std::string("\"bodyBytes\": \"").size() - 2;
			int endCur = json_message.find_first_of('\"', startBodyBytes + 2) + 1;
			json_message.replace(startBodyBytes, endCur - startBodyBytes, json_message_body);
			//printf("json: %s\n", json_message.data());

			
			Document parsed_json;
			parsed_json.Parse(json_message.data(), json_message.size());
			if (parsed_json.HasParseError()) {
				printf("error parsing json, error code: %d, offset: %d\n",
					parsed_json.GetParseError(), parsed_json.GetErrorOffset());
			}
			else {
				if (DataTypeConverter::replaceBase64WithHex(parsed_json, parsed_json.GetAllocator())) {
					StringBuffer buffer;
					PrettyWriter<StringBuffer> writer(buffer);
					parsed_json.Accept(writer);

					json_message = std::string(buffer.GetString(), buffer.GetLength());
				}
			}

			return json_message;
		}
	}
}